import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../database/store.service';
import { Activity, ActivityStatus, ActivityType } from '../domain';

@Injectable()
export class ActivitiesService {
  constructor(private readonly store: StoreService) {}

  /** 列表（默认只看未取消），带名额占用统计 */
  list(params?: { status?: ActivityStatus; includeCounts?: boolean }) {
    let list = [...this.store.activities];
    if (params?.status) list = list.filter((a) => a.status === params.status);
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return list.map((a) => this.decorate(a, params?.includeCounts !== false));
  }

  get(id: string, includeCounts = true): Activity & CapacityView {
    const a = this.store.activities.find((x) => x.id === id);
    if (!a) throw new NotFoundException('活动不存在');
    return this.decorate(a, includeCounts);
  }

  /** 活动详情：含报名名单（按签到状态分组） */
  detail(id: string) {
    const activity = this.get(id);
    const registrations = this.store.registrations
      .filter((r) => r.activityId === id)
      .map((r) => ({
        ...r,
        elder: this.store.elders.find((e) => e.id === r.elderId),
        volunteers: this.store.assignments
          .filter((asg) => asg.registrationId === r.id)
          .map((asg) => {
            const v = this.store.volunteers.find((x) => x.id === asg.volunteerId);
            return { assignmentId: asg.id, duty: asg.duty, note: asg.note, volunteer: v };
          }),
        record: this.store.records.find((rc) => rc.registrationId === r.id),
      }));
    return { activity, registrations };
  }

  create(dto: {
    title: string;
    type: ActivityType;
    description?: string;
    location: string;
    startTime: string;
    endTime: string;
    capacity: number;
    wheelchairCapacity?: number;
    transportCapacity?: number;
  }): Activity & CapacityView {
    if (!dto.title?.trim()) throw new BadRequestException('请填写活动标题');
    if (dto.startTime >= dto.endTime)
      throw new BadRequestException('活动结束时间必须晚于开始时间');
    const activity: Activity = {
      id: this.store.uuid('ac'),
      title: dto.title,
      type: dto.type,
      description: dto.description,
      location: dto.location,
      startTime: dto.startTime,
      endTime: dto.endTime,
      capacity: dto.capacity,
      wheelchairCapacity: dto.wheelchairCapacity ?? 0,
      transportCapacity: dto.transportCapacity ?? 0,
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    this.store.activities.push(activity);
    return this.decorate(activity, true);
  }

  /** 状态推进：published -> ongoing -> finished，或取消 */
  transition(id: string, action: 'start' | 'finish' | 'cancel') {
    const a = this.store.activities.find((x) => x.id === id);
    if (!a) throw new NotFoundException('活动不存在');
    const flow: Record<string, ActivityStatus> = {
      start: 'ongoing',
      finish: 'finished',
      cancel: 'cancelled',
    };
    const allowed: Record<ActivityStatus, string[]> = {
      draft: ['start', 'cancel'],
      published: ['start', 'cancel'],
      ongoing: ['finish', 'cancel'],
      finished: [],
      cancelled: [],
    };
    if (!allowed[a.status].includes(action))
      throw new BadRequestException(`当前状态「${a.status}」不允许该操作`);
    a.status = flow[action];

    // 活动开始后仍未签到的报名，活动结束时自动标记缺席
    if (action === 'finish') {
      for (const r of this.store.registrations) {
        if (r.activityId === id && r.status === 'registered') r.status = 'absent';
      }
    }
    return this.decorate(a, true);
  }

  private decorate(a: Activity, withCounts: boolean): Activity & CapacityView {
    if (!withCounts)
      return { ...a, registeredCount: 0, wheelchairUsed: 0, transportUsed: 0 };
    const valid = this.store.registrations.filter(
      (r) => r.activityId === a.id && r.status !== 'cancelled',
    );
    return {
      ...a,
      registeredCount: valid.length,
      wheelchairUsed: valid.filter((r) => r.needWheelchairSeat).length,
      transportUsed: valid.filter((r) => r.transportNeed.required).length,
    };
  }
}

export interface CapacityView {
  registeredCount: number;
  wheelchairUsed: number;
  transportUsed: number;
}
