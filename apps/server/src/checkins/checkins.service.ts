import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../database/store.service';

const DUTY_LABEL: Record<string, string> = {
  wheelchair_assist: '轮椅协助',
  transport: '接送',
  meal_assist: '用餐照护',
  companion: '全程陪护',
};

@Injectable()
export class CheckinsService {
  constructor(private readonly store: StoreService) {}

  /**
   * 活动当天签到。
   * 仅报名中/进行中的活动可签到；签到后报名进入已签到状态。
   */
  checkIn(activityId: string, elderId: string) {
    const activity = this.store.activities.find((a) => a.id === activityId);
    if (!activity) throw new NotFoundException('活动不存在');
    if (!['published', 'ongoing'].includes(activity.status))
      throw new BadRequestException('该活动当前不可签到');

    const reg = this.store.registrations.find(
      (r) => r.activityId === activityId && r.elderId === elderId,
    );
    if (!reg) throw new NotFoundException('未找到该老人的报名记录，请先报名');
    if (reg.status === 'cancelled') throw new BadRequestException('报名已取消');
    if (reg.status === 'checked_in')
      throw new BadRequestException('该老人已完成签到，请勿重复签到');

    reg.status = 'checked_in';
    reg.checkedInAt = new Date().toISOString();
    return { ok: true, checkedInAt: reg.checkedInAt, registrationId: reg.id };
  }

  /** 撤销签到（误操作纠正） */
  undoCheckIn(registrationId: string) {
    const reg = this.store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundException('报名记录不存在');
    if (reg.status !== 'checked_in') throw new BadRequestException('该记录未签到');
    reg.status = 'registered';
    reg.checkedInAt = undefined;
    return { ok: true };
  }

  /** 活动当天签到台视图：统计 + 待签到/已签到名单 */
  desk(activityId: string) {
    const activity = this.store.activities.find((a) => a.id === activityId);
    if (!activity) throw new NotFoundException('活动不存在');
    const regs = this.store.registrations
      .filter((r) => r.activityId === activityId && r.status !== 'cancelled')
      .map((r) => ({
        registrationId: r.id,
        elderId: r.elderId,
        elderName: this.store.elders.find((e) => e.id === r.elderId)?.name,
        mobility: r.mobility,
        needWheelchairSeat: r.needWheelchairSeat,
        dietaryRestrictions: r.dietaryRestrictions,
        transportRequired: r.transportNeed.required,
        status: r.status,
        registeredAt: r.registeredAt,
        checkedInAt: r.checkedInAt,
      }));
    return {
      activity,
      total: regs.length,
      checkedInCount: regs.filter((r) => r.status === 'checked_in').length,
      pending: regs.filter((r) => r.status === 'registered'),
      checkedIn: regs.filter((r) => r.status === 'checked_in'),
    };
  }

  /**
   * 志愿者当天照护名单（核心场景）：
   * 签到后，志愿者只能看到自己被分工负责的、已签到的老人，
   * 并拿到行动能力、轮椅位、饮食禁忌、接送信息等照护要点。
   */
  volunteerRoster(activityId: string, volunteerId: string) {
    const activity = this.store.activities.find((a) => a.id === activityId);
    if (!activity) throw new NotFoundException('活动不存在');
    const volunteer = this.store.volunteers.find((v) => v.id === volunteerId);
    if (!volunteer) throw new NotFoundException('志愿者不存在');

    const mine = this.store.assignments.filter(
      (a) => a.activityId === activityId && a.volunteerId === volunteerId,
    );

    const elders = mine
      .map((a) => {
        const reg = this.store.registrations.find((r) => r.id === a.registrationId);
        if (!reg) return null;
        const elder = this.store.elders.find((e) => e.id === reg.elderId);
        return {
          assignmentId: a.id,
          duty: a.duty,
          dutyLabel: DUTY_LABEL[a.duty] ?? a.duty,
          assignmentNote: a.note,
          checkedIn: reg.status === 'checked_in',
          checkedInAt: reg.checkedInAt,
          status: reg.status,
          elder: elder
            ? {
                id: elder.id,
                name: elder.name,
                gender: elder.gender,
                age: elder.age,
                phone: elder.phone,
                address: elder.address,
                emergencyContactName: elder.emergencyContactName,
                emergencyContactPhone: elder.emergencyContactPhone,
                conditions: elder.conditions,
              }
            : null,
          care: {
            mobility: reg.mobility,
            needWheelchairSeat: reg.needWheelchairSeat,
            dietaryRestrictions: reg.dietaryRestrictions,
            transportNeed: reg.transportNeed,
            remark: reg.remark,
          },
        };
      })
      .filter(Boolean);

    // 名单按“未签到提醒”优先、再接送/轮椅排序，方便志愿者行动
    elders.sort((x, y) => {
      if (x!.checkedIn !== y!.checkedIn) return x!.checkedIn ? 1 : -1;
      if (x!.duty === 'transport' && y!.duty !== 'transport') return -1;
      if (y!.duty === 'transport' && x!.duty !== 'transport') return 1;
      return x!.elder!.name.localeCompare(y!.elder!.name, 'zh');
    });

    return {
      activity,
      volunteer: { id: volunteer.id, name: volunteer.name, phone: volunteer.phone, skills: volunteer.skills },
      totalAssigned: elders.length,
      checkedInCount: elders.filter((e) => e!.checkedIn).length,
      elders,
    };
  }
}
