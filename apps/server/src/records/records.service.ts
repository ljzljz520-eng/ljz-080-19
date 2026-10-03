import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../database/store.service';
import { ParticipationRecord } from '../domain';

export interface FillRecordDto {
  attended: boolean;
  healthTopics?: string[];
  haircutServices?: string[];
  mealSituation?: string;
  healthNote?: string;
  careFeedback?: string;
  satisfaction?: number;
  filledBy?: string;
}

@Injectable()
export class RecordsService {
  constructor(private readonly store: StoreService) {}

  /** 某场活动的全部参与记录 */
  listByActivity(activityId: string) {
    return this.store.records
      .filter((r) => r.activityId === activityId)
      .map((r) => this.enrich(r));
  }

  /** 某位老人的参与历史 */
  listByElder(elderId: string) {
    return this.store.records
      .filter((r) => r.elderId === elderId)
      .sort((a, b) => b.filledAt.localeCompare(a.filledAt))
      .map((r) => this.enrich(r));
  }

  /** 回填（幂等：一条报名对应一条参与记录，重复提交为更新） */
  fill(registrationId: string, dto: FillRecordDto) {
    const reg = this.store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundException('报名记录不存在');
    const activity = this.store.activities.find((a) => a.id === reg.activityId);
    if (activity && !['ongoing', 'finished'].includes(activity.status))
      throw new BadRequestException('活动开始后才能回填参与记录');

    let record = this.store.records.find((r) => r.registrationId === registrationId);
    if (record) {
      Object.assign(record, {
        ...dto,
        healthTopics: dto.healthTopics ?? record.healthTopics,
        haircutServices: dto.haircutServices ?? record.haircutServices,
        filledAt: new Date().toISOString(),
      });
    } else {
      record = {
        id: this.store.uuid('pr'),
        activityId: reg.activityId,
        registrationId,
        elderId: reg.elderId,
        attended: dto.attended,
        healthTopics: dto.healthTopics,
        haircutServices: dto.haircutServices,
        mealSituation: dto.mealSituation,
        healthNote: dto.healthNote,
        careFeedback: dto.careFeedback,
        satisfaction: dto.satisfaction,
        filledBy: dto.filledBy,
        filledAt: new Date().toISOString(),
      };
      this.store.records.push(record);
    }
    return this.enrich(record);
  }

  /**
   * 基于参与记录的后续服务推荐。
   * 输入老人，综合其档案（行动能力/饮食禁忌/慢病）与历次参与记录，
   * 产出可解释的推荐项，供社区运营为老人匹配合适的服务与活动。
   */
  recommend(elderId: string) {
    const elder = this.store.elders.find((e) => e.id === elderId);
    if (!elder) throw new NotFoundException('老人档案不存在');

    const regs = this.store.registrations.filter((r) => r.elderId === elderId);
    const records = this.store.records
      .filter((r) => r.elderId === elderId)
      .sort((a, b) => b.filledAt.localeCompare(a.filledAt));

    const tips: { type: string; level: 'info' | 'suggest' | 'attention'; text: string }[] = [];
    const activityRecs: { type: string; title: string; reason: string }[] = [];

    const attendedTypes = new Set(
      records.filter((r) => r.attended).map((r) => {
        const a = this.store.activities.find((x) => x.id === r.activityId);
        return a?.type;
      }),
    );

    // —— 基于档案的基础推荐 ——
    if (elder.conditions.includes('糖尿病')) {
      activityRecs.push({
        type: 'health_lecture',
        title: '糖尿病饮食与血糖管理讲座',
        reason: '老人患糖尿病，适合控糖主题健康讲座；聚餐活动需预留低糖餐',
      });
      tips.push({ type: 'meal', level: 'attention', text: '聚餐务必提前预留低糖餐，并提醒按时用药' });
    }
    if (elder.conditions.includes('高血压')) {
      activityRecs.push({
        type: 'health_lecture',
        title: '高血压日常管理与义诊',
        reason: '老人患高血压，建议参加血压监测与低盐饮食主题活动',
      });
      tips.push({ type: 'meal', level: 'info', text: '饮食禁忌含低盐，备餐时注意少盐' });
    }
    if (elder.mobility === 'wheelchair' || elder.wheelchairSeat) {
      tips.push({
        type: 'accessibility',
        level: 'attention',
        text: '行动需轮椅：活动需预留轮椅位，优先安排可驾驶志愿者接送与轮椅协助',
      });
      activityRecs.push({
        type: 'haircut',
        title: '可预约上门义剪',
        reason: '老人乘轮椅出行不便，义剪活动可协调志愿者上门服务',
      });
    } else if (elder.mobility === 'walker' || elder.mobility === 'cane') {
      tips.push({ type: 'accessibility', level: 'suggest', text: '行动不便，建议安排座位靠近出入口并由志愿者陪护' });
    }
    if (elder.dietaryRestrictions.length) {
      tips.push({
        type: 'meal',
        level: 'info',
        text: `饮食禁忌：${elder.dietaryRestrictions.join('、')}，节日聚餐前需同步食堂单独备餐`,
      });
    }

    // —— 基于参与记录的行为推荐 ——
    for (const r of records) {
      const activity = this.store.activities.find((a) => a.id === r.activityId);
      if (!r.attended) {
        tips.push({
          type: 'followup',
          level: 'attention',
          text: `缺席《${activity?.title ?? r.activityId}》，建议电话回访了解原因，必要时转介上门服务`,
        });
        continue;
      }
      r.healthTopics?.forEach((t) => {
        if (!activityRecs.some((x) => x.reason.includes(t))) {
          activityRecs.push({
            type: 'health_lecture',
            title: `「${t}」进阶健康讲座`,
            reason: `在《${activity?.title}》中关注了“${t}”，可推荐同主题进阶讲座与义诊`,
          });
        }
      });
      if (r.healthNote) {
        tips.push({
          type: 'health',
          level: 'attention',
          text: `《${activity?.title}》现场观察：${r.healthNote}，建议纳入下次活动照护要点并通知家属`,
        });
      }
    }

    if (records.length === 0) {
      activityRecs.push({
        type: 'festival_meal',
        title: '邀请参加近期节日聚餐',
        reason: '老人暂无活动参与记录，聚餐社交门槛低，适合作为首次参与活动',
      });
    }
    if (!attendedTypes.has('haircut')) {
      activityRecs.push({
        type: 'haircut',
        title: '爱心义剪日',
        reason: '历史未参与过义剪，可根据季节主动邀约一次免费理发',
      });
    }

    // —— 从“报名中”的活动里挑可直接报名的候选 ——
    const openActivities = this.store.activities
      .filter((a) => a.status === 'published')
      .map((a) => {
        const match = activityRecs.some((r) => r.type === a.type);
        const reg = regs.find((r) => r.activityId === a.id && r.status !== 'cancelled');
        return {
          activityId: a.id,
          title: a.title,
          type: a.type,
          startTime: a.startTime,
          location: a.location,
          reason: match
            ? activityRecs.find((r) => r.type === a.type)?.reason
            : undefined,
          alreadyRegistered: !!reg,
        };
      });

    return {
      elder: {
        id: elder.id,
        name: elder.name,
        age: elder.age,
        mobility: elder.mobility,
        dietaryRestrictions: elder.dietaryRestrictions,
        conditions: elder.conditions,
      },
      stats: {
        participated: records.filter((r) => r.attended).length,
        absent: records.filter((r) => !r.attended).length,
        avgSatisfaction:
          records.filter((r) => typeof r.satisfaction === 'number').length > 0
            ? Math.round(
                (records.reduce((s, r) => s + (r.satisfaction ?? 0), 0) /
                  records.filter((r) => typeof r.satisfaction === 'number').length) *
                  10,
              ) / 10
            : null,
      },
      careTips: tips,
      recommendations: activityRecs,
      openActivities,
    };
  }

  private enrich(r: ParticipationRecord) {
    return {
      ...r,
      elder: this.store.elders.find((e) => e.id === r.elderId),
      activity: this.store.activities.find((a) => a.id === r.activityId),
    };
  }
}
