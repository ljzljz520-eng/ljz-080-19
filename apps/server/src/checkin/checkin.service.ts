import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataStore } from '../database/data-store';
import { Activity, Participant, Registration, Volunteer } from '../domain';

/** 签到成功响应：附老人与志愿者信息，方便签到台/志愿者即时核对照护要点 */
export interface CheckInView extends Registration {
  participant: Participant;
  assignedVolunteerName?: string;
}

@Injectable()
export class CheckinService {
  constructor(private readonly store: DataStore) {}

  private async toView(reg: Registration): Promise<CheckInView> {
    const participants = await this.store.list<Participant>('participants');
    const volunteers = await this.store.list<Volunteer>('volunteers');
    const participant = participants.find((p) => p.id === reg.participantId);
    if (!participant) throw new NotFoundException('老人档案缺失');
    const volunteer = reg.assignedVolunteerId
      ? volunteers.find((v) => v.id === reg.assignedVolunteerId)
      : undefined;
    return { ...reg, participant, assignedVolunteerName: volunteer?.name };
  }

  /** 老人到场报 6 位签到码签到 */
  async checkInByCode(activityId: string, code: string): Promise<CheckInView> {
    const code6 = code.trim();
    if (!/^\d{6}$/.test(code6))
      throw new BadRequestException('请输入 6 位签到码');

    const regs = await this.store.list<Registration>('registrations');
    const reg = regs.find(
      (r) => r.activityId === activityId && r.checkInCode === code6,
    );
    if (!reg) throw new NotFoundException('签到码无效，请核对后重试');
    if (reg.status === 'cancelled')
      throw new BadRequestException('该报名已取消');
    if (reg.status === 'checked_in')
      throw new BadRequestException('这位老人已签到，请勿重复操作');

    const updated = await this.store.update<Registration>(
      'registrations',
      reg.id,
      {
        status: 'checked_in',
        checkedInAt: new Date().toISOString(),
      },
    );
    return this.toView(updated);
  }

  /** 志愿者在名单上直接确认签到 */
  async checkInByRegistration(registrationId: string): Promise<CheckInView> {
    const regs = await this.store.list<Registration>('registrations');
    const reg = regs.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundException('报名记录不存在');
    if (reg.status === 'cancelled')
      throw new BadRequestException('该报名已取消');
    if (reg.status === 'checked_in') return this.toView(reg);

    const updated = await this.store.update<Registration>(
      'registrations',
      registrationId,
      {
        status: 'checked_in',
        checkedInAt: new Date().toISOString(),
      },
    );
    return this.toView(updated);
  }

  /** 活动结束：未签到者标记爽约并结束活动 */
  async markNoShows(activityId: string): Promise<number> {
    const activities = await this.store.list<Activity>('activities');
    if (!activities.some((a) => a.id === activityId))
      throw new NotFoundException('活动不存在');
    const regs = await this.store.list<Registration>('registrations');
    const pending = regs.filter(
      (r) => r.activityId === activityId && r.status === 'registered',
    );
    for (const r of pending) {
      await this.store.update<Registration>('registrations', r.id, {
        status: 'no_show',
      });
    }
    await this.store.update<Activity>('activities', activityId, {
      status: 'finished',
    });
    return pending.length;
  }
}
