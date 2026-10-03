import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataStore } from '../database/data-store';
import {
  Activity,
  Participant,
  Registration,
  RosterRow,
  Volunteer,
} from '../domain';
import { CreateRegistrationDto, RosterResult } from './dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly store: DataStore) {}

  private genCode(existing: Registration[]): string {
    for (let i = 0; i < 50; i++) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      if (!existing.some((r) => r.checkInCode === code)) return code;
    }
    return String(Date.now()).slice(-6);
  }

  /** 为报名自动分配合适的志愿者：优先默认照护关系，其次当前活动分配最少者 */
  private async assignVolunteer(
    activity: Activity,
    participantId: string,
    existing: Registration[],
  ): Promise<string | undefined> {
    if (activity.volunteerIds.length === 0) return undefined;
    const volunteers = await this.store.list<Volunteer>('volunteers');
    const related = volunteers.find(
      (v) =>
        activity.volunteerIds.includes(v.id) &&
        v.careElderIds.includes(participantId),
    );
    if (related) return related.id;

    const load = new Map<string, number>(
      activity.volunteerIds.map((id) => [id, 0]),
    );
    for (const r of existing) {
      if (
        r.activityId === activity.id &&
        r.assignedVolunteerId &&
        r.status !== 'cancelled'
      ) {
        load.set(
          r.assignedVolunteerId,
          (load.get(r.assignedVolunteerId) ?? 0) + 1,
        );
      }
    }
    return [...load.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
  }

  async create(dto: CreateRegistrationDto): Promise<Registration> {
    if (!dto.emergencyContact?.name || !dto.emergencyContact?.phone) {
      throw new BadRequestException('请登记紧急联系人及电话');
    }
    if (!dto.mobility) throw new BadRequestException('请选择行动能力');
    if (dto.wheelchairSeat && dto.mobility !== 'wheelchair') {
      throw new BadRequestException(
        '只有行动能力为“依靠轮椅”的老人需要预留轮椅位',
      );
    }
    if (dto.transportNeed !== 'none' && !dto.transportAddress?.trim()) {
      throw new BadRequestException('需要接送时请填写接送地址');
    }

    const activities = await this.store.list<Activity>('activities');
    const activity = activities.find((a) => a.id === dto.activityId);
    if (!activity) throw new NotFoundException('活动不存在');
    if (activity.status === 'finished')
      throw new BadRequestException('活动已结束，无法报名');
    if (dto.transportNeed !== 'none' && !activity.transportProvided) {
      throw new BadRequestException('本活动不提供接送服务');
    }

    // 新老人建档
    let participantId = dto.participantId;
    if (!participantId) {
      if (!dto.newParticipant?.name?.trim()) {
        throw new BadRequestException('请填写老人姓名');
      }
      const np = dto.newParticipant;
      const created = await this.store.insert<Participant>('participants', {
        id: randomUUID(),
        name: np.name.trim(),
        gender: np.gender,
        age: Number(np.age),
        phone: np.phone,
        address: np.address,
        mobility: dto.mobility,
        dietaryRestrictions: dto.dietaryRestrictions ?? [],
        healthNote: np.healthNote,
        emergencyContact: dto.emergencyContact,
      });
      participantId = created.id;
    }

    const registrations = await this.store.list<Registration>('registrations');

    // 防重复报名
    const dup = registrations.find(
      (r) =>
        r.activityId === dto.activityId &&
        r.participantId === participantId &&
        r.status !== 'cancelled',
    );
    if (dup) throw new ConflictException('该老人已报名本活动，请勿重复报名');

    const actRegs = registrations.filter(
      (r) => r.activityId === activity.id && r.status !== 'cancelled',
    );
    if (actRegs.length >= activity.capacity) {
      throw new ConflictException('活动名额已满');
    }
    if (
      dto.wheelchairSeat &&
      actRegs.filter((r) => r.wheelchairSeat).length >= activity.wheelchairSpots
    ) {
      throw new ConflictException('轮椅位已订满，请联系社区协调');
    }

    const assignedVolunteerId = await this.assignVolunteer(
      activity,
      participantId,
      registrations,
    );

    const registration: Registration = {
      id: randomUUID(),
      activityId: dto.activityId,
      participantId: participantId,
      mobility: dto.mobility,
      wheelchairSeat: !!dto.wheelchairSeat,
      dietaryRestrictions: dto.dietaryRestrictions ?? [],
      transportNeed: dto.transportNeed,
      transportAddress:
        dto.transportNeed === 'none' ? undefined : dto.transportAddress?.trim(),
      careNote: dto.careNote?.trim() || undefined,
      emergencyContact: dto.emergencyContact,
      status: 'registered',
      assignedVolunteerId,
      registeredAt: new Date().toISOString(),
      checkInCode: this.genCode(registrations),
    };
    return this.store.insert('registrations', registration);
  }

  async list(filter?: {
    activityId?: string;
    participantId?: string;
  }): Promise<(Registration & { assignedVolunteerName?: string })[]> {
    const all = await this.store.list<Registration>('registrations');
    const volunteers = await this.store.list<Volunteer>('volunteers');
    const vMap = new Map(volunteers.map((v) => [v.id, v]));
    return all
      .filter(
        (r) =>
          (!filter?.activityId || r.activityId === filter.activityId) &&
          (!filter?.participantId || r.participantId === filter.participantId),
      )
      .map((r) => ({
        ...r,
        assignedVolunteerName: r.assignedVolunteerId
          ? vMap.get(r.assignedVolunteerId)?.name
          : undefined,
      }));
  }

  async cancel(id: string): Promise<Registration> {
    const all = await this.store.list<Registration>('registrations');
    if (!all.some((r) => r.id === id))
      throw new NotFoundException('报名记录不存在');
    return this.store.update<Registration>('registrations', id, {
      status: 'cancelled',
    });
  }

  /** 组装带老人档案与志愿者信息的照护名单行 */
  async buildRosterRows(activityId: string): Promise<RosterRow[]> {
    const regs = (await this.list({ activityId })).filter(
      (r) => r.status !== 'cancelled',
    );
    const participants = await this.store.list<Participant>('participants');
    const volunteers = await this.store.list<Volunteer>('volunteers');
    const pMap = new Map(participants.map((p) => [p.id, p]));
    const vMap = new Map(volunteers.map((v) => [v.id, v]));
    return regs.map((r) => {
      const p = pMap.get(r.participantId)!;
      const v = r.assignedVolunteerId
        ? vMap.get(r.assignedVolunteerId)
        : undefined;
      return {
        registrationId: r.id,
        participant: p,
        mobility: r.mobility,
        wheelchairSeat: r.wheelchairSeat,
        dietaryRestrictions: r.dietaryRestrictions,
        transportNeed: r.transportNeed,
        transportAddress: r.transportAddress,
        careNote: r.careNote,
        emergencyContact: r.emergencyContact,
        status: r.status,
        registeredAt: r.registeredAt,
        checkedInAt: r.checkedInAt,
        assignedVolunteerId: r.assignedVolunteerId,
        assignedVolunteerName: v?.name,
      };
    });
  }

  /** 活动完整签到/照护名单（管理端 & 活动当天） */
  async activityRoster(activityId: string): Promise<RosterResult> {
    const rows = await this.buildRosterRows(activityId);
    return {
      activityId,
      rows: rows.sort((a, b) => {
        // 需重点照护的排前面：轮椅 > 助行器 > 迟缓 > 自理
        const order = { wheelchair: 0, walker: 1, slow: 2, independent: 3 };
        const d = order[a.mobility] - order[b.mobility];
        return d !== 0
          ? d
          : a.participant.name.localeCompare(b.participant.name, 'zh');
      }),
      summary: {
        total: rows.length,
        checkedIn: rows.filter((r) => r.status === 'checked_in').length,
        wheelchair: rows.filter((r) => r.wheelchairSeat).length,
        needTransport: rows.filter((r) => r.transportNeed !== 'none').length,
      },
    };
  }

  /** 某名志愿者在某场活动负责照护的老人名单 */
  async volunteerRoster(
    volunteerId: string,
    activityId: string,
  ): Promise<RosterResult> {
    const all = await this.activityRoster(activityId);
    const rows = all.rows.filter((r) => r.assignedVolunteerId === volunteerId);
    return {
      activityId,
      rows,
      summary: {
        total: rows.length,
        checkedIn: rows.filter((r) => r.status === 'checked_in').length,
        wheelchair: rows.filter((r) => r.wheelchairSeat).length,
        needTransport: rows.filter((r) => r.transportNeed !== 'none').length,
      },
    };
  }
}
