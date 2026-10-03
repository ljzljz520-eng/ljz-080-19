import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataStore } from '../database/data-store';
import {
  Activity,
  ACTIVITY_TYPE_LABEL,
  ActivityType,
  ParticipationRecord,
  Participant,
  Registration,
  ServiceRecommendation,
} from '../domain';

export class BackfillDto {
  registrationId!: string;
  attended!: boolean;
  usedWheelchairSeat?: boolean;
  usedTransport?: boolean;
  mealNote?: string;
  careSummary?: string;
  tags?: string[];
}

/** 根据报名+签到情况推导默认标签，志愿者可在此基础上修改 */
const TYPE_TAG: Record<ActivityType, string[]> = {
  health_talk: ['健康讲座', '关注慢病管理'],
  haircut: ['义剪', '关注个人照护'],
  dinner: ['聚餐', '社交参与'],
  other: ['社区活动'],
};

@Injectable()
export class ParticipationService {
  constructor(private readonly store: DataStore) {}

  async backfill(dto: BackfillDto): Promise<ParticipationRecord> {
    const regs = await this.store.list<Registration>('registrations');
    const reg = regs.find((r) => r.id === dto.registrationId);
    if (!reg) throw new NotFoundException('报名记录不存在');

    const records = await this.store.list<ParticipationRecord>(
      'participation_records',
    );
    const existing = records.find(
      (r) => r.registrationId === dto.registrationId,
    );

    const autoTags = new Set<string>([
      ...(dto.attended
        ? TYPE_TAG[(await this.activityOf(reg.activityId)).type]
        : []),
      ...(dto.attended === false ? ['爽约，需电话回访'] : []),
      ...(dto.usedWheelchairSeat ? ['使用轮椅位，优先无障碍场地'] : []),
      ...(dto.usedTransport ? ['使用接送服务'] : []),
      ...(dto.tags ?? []),
    ]);

    const record: ParticipationRecord = {
      id: existing?.id ?? randomUUID(),
      activityId: reg.activityId,
      participantId: reg.participantId,
      registrationId: reg.id,
      attended: !!dto.attended,
      usedWheelchairSeat: !!dto.usedWheelchairSeat,
      usedTransport: !!dto.usedTransport,
      mealNote: dto.mealNote?.trim() || undefined,
      careSummary: dto.careSummary?.trim() || undefined,
      tags: [...autoTags],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      return this.store.update('participation_records', existing.id, record);
    }
    return this.store.insert('participation_records', record);
  }

  private async activityOf(activityId: string): Promise<Activity> {
    const activities = await this.store.list<Activity>('activities');
    const a = activities.find((x) => x.id === activityId);
    if (!a) throw new BadRequestException('活动不存在');
    return a;
  }

  async listByActivity(
    activityId: string,
  ): Promise<(ParticipationRecord & { participantName: string })[]> {
    const records = (
      await this.store.list<ParticipationRecord>('participation_records')
    ).filter((r) => r.activityId === activityId);
    const participants = await this.store.list<Participant>('participants');
    const pMap = new Map(participants.map((p) => [p.id, p]));
    return records.map((r) => ({
      ...r,
      participantName: pMap.get(r.participantId)?.name ?? '未知老人',
    }));
  }

  async listByParticipant(
    participantId: string,
  ): Promise<ParticipationRecord[]> {
    return (
      await this.store.list<ParticipationRecord>('participation_records')
    ).filter((r) => r.participantId === participantId);
  }

  /**
   * 基于历史参与记录 + 老人画像，为每位老人推荐更合适的后续活动：
   * - 参加过同类型活动 => 加分
   * - 健康讲座记录中的慢病标签 => 推荐健康讲座
   * - 义剪/照护记录 + 行动能力差 => 推荐义剪
   * - 轮椅需求 => 无足够轮椅位的活动降权
   * - 接送需求 => 不提供接送的活动降权
   * - 饮食禁忌 => 聚餐匹配度调整
   */
  async recommendForParticipant(
    participantId: string,
  ): Promise<ServiceRecommendation> {
    const participants = await this.store.list<Participant>('participants');
    const p = participants.find((x) => x.id === participantId);
    if (!p) throw new NotFoundException('老人档案不存在');

    const [activities, records, regs] = await Promise.all([
      this.store.list<Activity>('activities'),
      this.store.list<ParticipationRecord>('participation_records'),
      this.store.list<Registration>('registrations'),
    ]);

    const history = records.filter((r) => r.participantId === participantId);
    const attendedTypes = new Set(
      history
        .filter((r) => r.attended)
        .map((r) => activities.find((a) => a.id === r.activityId)?.type),
    );
    const allTags = new Set(history.flatMap((r) => r.tags));
    const everNoShow = history.some((r) => !r.attended);
    const needWheelchair =
      p.mobility === 'wheelchair' ||
      regs.some((r) => r.participantId === participantId && r.wheelchairSeat);
    const needTransport = regs.some(
      (r) => r.participantId === participantId && r.transportNeed !== 'none',
    );

    const upcoming = activities
      .filter(
        (a) =>
          new Date(a.startTime).getTime() > Date.now() &&
          a.status !== 'finished',
      )
      .filter((a) =>
        regs.every(
          (r) =>
            !(
              r.activityId === a.id &&
              r.participantId === participantId &&
              r.status !== 'cancelled'
            ),
        ),
      );

    const reasons: string[] = [];
    const scored = upcoming.map((a) => {
      let score = 50;
      if (attendedTypes.has(a.type)) {
        score += 25;
        reasons.push(`曾参加过${ACTIVITY_TYPE_LABEL[a.type]}，参与意愿高`);
      }
      if (
        a.type === 'health_talk' &&
        (allTags.has('关注慢病管理') || p.healthNote)
      ) {
        score += 15;
        reasons.push('结合慢病/健康备注，适合健康讲座');
      }
      if (
        a.type === 'haircut' &&
        (p.mobility === 'wheelchair' || p.mobility === 'walker')
      ) {
        score += 10;
        reasons.push('义剪可优先安排行动不便老人');
      }
      if (a.type === 'dinner' && p.dietaryRestrictions.length > 0) {
        score += 8;
        reasons.push('聚餐可按其饮食禁忌单独备餐');
      }
      if (needWheelchair) {
        if (a.wheelchairSpots <= 0) score -= 40;
        else score += 5;
      }
      if (needTransport && !a.transportProvided) {
        score -= 30;
        reasons.push('该活动不提供接送，需另行协调');
      }
      if (everNoShow) score -= 5;
      return {
        activityId: a.id,
        title: a.title,
        type: a.type,
        match: Math.max(0, Math.min(99, score)),
      };
    });

    const suggestedActivities = scored
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
    const reason =
      reasons.length > 0
        ? [...new Set(reasons)].slice(0, 3).join('；')
        : '暂无足够历史记录，默认推荐近期活动';

    return { participantId, reason, suggestedActivities };
  }
}
