import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../database/store.service';
import {
  CareAssignment,
  MobilityLevel,
  Registration,
  TransportNeed,
} from '../domain';
import { VolunteersService } from '../volunteers/volunteers.service';

export interface CreateRegistrationDto {
  activityId: string;
  elderId: string;
  mobility?: MobilityLevel;
  needWheelchairSeat?: boolean;
  dietaryRestrictions?: string[];
  transportNeed?: TransportNeed;
  remark?: string;
}

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly store: StoreService,
    private readonly volunteersService: VolunteersService,
  ) {}

  /** 某活动的报名名单 */
  listByActivity(activityId: string) {
    return this.store.registrations
      .filter((r) => r.activityId === activityId)
      .map((r) => this.enrich(r));
  }

  /** 某老人的报名历史 */
  listByElder(elderId: string) {
    return this.store.registrations
      .filter((r) => r.elderId === elderId)
      .map((r) => ({
        ...this.enrich(r),
        activity: this.store.activities.find((a) => a.id === r.activityId),
      }));
  }

  get(id: string) {
    const r = this.store.registrations.find((x) => x.id === id);
    if (!r) throw new NotFoundException('报名记录不存在');
    return this.enrich(r);
  }

  /**
   * 报名：默认带出老人档案中的行动能力/轮椅位/饮食禁忌，
   * 允许针对本场活动修改；活动当天志愿者看到的是这份快照。
   */
  create(dto: CreateRegistrationDto) {
    const activity = this.store.activities.find((a) => a.id === dto.activityId);
    if (!activity) throw new NotFoundException('活动不存在');
    if (activity.status !== 'published')
      throw new BadRequestException('该活动当前不在报名中');

    const elder = this.store.elders.find((e) => e.id === dto.elderId);
    if (!elder) throw new NotFoundException('老人档案不存在');

    const dup = this.store.registrations.find(
      (r) =>
        r.activityId === dto.activityId &&
        r.elderId === dto.elderId &&
        r.status !== 'cancelled',
    );
    if (dup) throw new BadRequestException('该老人已报名此活动，请勿重复报名');

    const valid = this.store.registrations.filter(
      (r) => r.activityId === activity.id && r.status !== 'cancelled',
    );
    if (valid.length >= activity.capacity)
      throw new BadRequestException('活动名额已满');

    const mobility = dto.mobility ?? elder.mobility;
    // 乘轮椅老人默认需要轮椅位，也可显式声明
    const needWheelchairSeat =
      dto.needWheelchairSeat ?? (mobility === 'wheelchair' || elder.wheelchairSeat);
    const dietaryRestrictions = dto.dietaryRestrictions ?? elder.dietaryRestrictions;
    const transportNeed: TransportNeed = dto.transportNeed ?? { required: false };

    if (needWheelchairSeat) {
      const used = valid.filter((r) => r.needWheelchairSeat).length;
      if (used >= activity.wheelchairCapacity)
        throw new BadRequestException('轮椅位已满，请联系工作人员协调');
    }
    if (transportNeed.required) {
      if (!transportNeed.pickupAddress?.trim())
        throw new BadRequestException('需要接送时请填写接人地址');
      const used = valid.filter((r) => r.transportNeed.required).length;
      if (used >= activity.transportCapacity)
        throw new BadRequestException('接送车位已满，请联系工作人员协调');
    }

    const reg: Registration = {
      id: this.store.uuid('re'),
      activityId: dto.activityId,
      elderId: dto.elderId,
      mobility,
      needWheelchairSeat,
      dietaryRestrictions,
      transportNeed,
      remark: dto.remark,
      status: 'registered',
      registeredAt: new Date().toISOString(),
    };
    this.store.registrations.push(reg);
    return this.enrich(reg);
  }

  /** 取消报名 */
  cancel(id: string, reason?: string) {
    const r = this.store.registrations.find((x) => x.id === id);
    if (!r) throw new NotFoundException('报名记录不存在');
    if (r.status === 'checked_in')
      throw new BadRequestException('已签到的报名不能取消');
    r.status = 'cancelled';
    r.remark = reason ? `[已取消] ${reason}${r.remark ? '｜' + r.remark : ''}` : r.remark;
    // 释放分工
    this.store.assignments = this.store.assignments.filter(
      (a) => a.registrationId !== id,
    );
    return this.enrich(r);
  }

  /**
   * 安排志愿者照护分工。
   * 校验志愿者的照护能力是否匹配老人行动能力；
   * 接送分工要求志愿者可驾驶。
   */
  assign(
    registrationId: string,
    dto: { volunteerId: string; duty: CareAssignment['duty']; note?: string },
  ) {
    const reg = this.store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundException('报名记录不存在');
    const volunteer = this.volunteersService.get(dto.volunteerId);

    if (!this.volunteersService.canCare(volunteer, reg.mobility))
      throw new BadRequestException(
        `志愿者${volunteer.name}的照护能力不适合行动能力为「${reg.mobility}」的老人`,
      );
    if (dto.duty === 'transport' && !volunteer.canDrive)
      throw new BadRequestException('接送分工需要安排可驾驶的志愿者');
    if (dto.duty === 'wheelchair_assist' && !reg.needWheelchairSeat)
      throw new BadRequestException('该报名未预留轮椅位，无需轮椅协助分工');
    if (dto.duty === 'transport' && !reg.transportNeed.required)
      throw new BadRequestException('该报名无接送需求');

    const exists = this.store.assignments.find(
      (a) =>
        a.registrationId === registrationId &&
        a.volunteerId === dto.volunteerId &&
        a.duty === dto.duty,
    );
    if (exists) throw new BadRequestException('该分工已存在');

    const assignment: CareAssignment = {
      id: this.store.uuid('as'),
      activityId: reg.activityId,
      registrationId,
      elderId: reg.elderId,
      volunteerId: dto.volunteerId,
      duty: dto.duty,
      note: dto.note,
    };
    this.store.assignments.push(assignment);
    return this.enrich(reg);
  }

  unassign(assignmentId: string) {
    const before = this.store.assignments.length;
    this.store.assignments = this.store.assignments.filter(
      (a) => a.id !== assignmentId,
    );
    if (this.store.assignments.length === before)
      throw new NotFoundException('分工不存在');
    return { ok: true };
  }

  private enrich(reg: Registration) {
    const elder = this.store.elders.find((e) => e.id === reg.elderId);
    const activity = this.store.activities.find((a) => a.id === reg.activityId);
    const volunteers = this.store.assignments
      .filter((a) => a.registrationId === reg.id)
      .map((a) => ({
        assignmentId: a.id,
        duty: a.duty,
        note: a.note,
        volunteer: this.store.volunteers.find((v) => v.id === a.volunteerId),
      }));
    const record = this.store.records.find((rc) => rc.registrationId === reg.id);
    return { ...reg, elder, activity, volunteers, record };
  }
}
