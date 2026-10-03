import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataStore } from '../database/data-store';
import { Activity, Registration } from '../domain';
import { ActivityView, CreateActivityDto, typeLabelOf } from './dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly store: DataStore) {}

  private async toView(a: Activity): Promise<ActivityView> {
    const regs = await this.store.list<Registration>('registrations');
    const mine = regs.filter(
      (r) => r.activityId === a.id && r.status !== 'cancelled',
    );
    const wheelchairSeatTaken = mine.filter((r) => r.wheelchairSeat).length;
    const transportCount = mine.filter(
      (r) => r.transportNeed !== 'none',
    ).length;
    const registeredCount = mine.length;
    const checkedInCount = mine.filter((r) => r.status === 'checked_in').length;
    return {
      ...a,
      typeLabel: typeLabelOf(a.type),
      stats: {
        registeredCount,
        checkedInCount,
        wheelchairSeatTaken,
        transportCount,
        remaining: a.capacity - registeredCount,
        wheelchairRemaining: a.wheelchairSpots - wheelchairSeatTaken,
      },
    };
  }

  async list(status?: string): Promise<ActivityView[]> {
    const all = await this.store.list<Activity>('activities');
    const filtered = status ? all.filter((a) => a.status === status) : all;
    return Promise.all(
      [...filtered]
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((a) => this.toView(a)),
    );
  }

  async get(id: string): Promise<ActivityView> {
    const all = await this.store.list<Activity>('activities');
    const activity = all.find((a) => a.id === id);
    if (!activity) throw new NotFoundException('活动不存在');
    return this.toView(activity);
  }

  async create(dto: CreateActivityDto): Promise<ActivityView> {
    if (!dto.title?.trim()) throw new BadRequestException('请填写活动标题');
    if (!dto.location?.trim()) throw new BadRequestException('请填写活动地点');
    if (new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
    if (dto.wheelchairSpots > dto.capacity) {
      throw new BadRequestException('轮椅位不能超过总名额');
    }
    const activity: Activity = {
      id: randomUUID(),
      title: dto.title.trim(),
      type: dto.type,
      description: dto.description ?? '',
      location: dto.location,
      startTime: new Date(dto.startTime).toISOString(),
      endTime: new Date(dto.endTime).toISOString(),
      capacity: Number(dto.capacity),
      wheelchairSpots: Number(dto.wheelchairSpots),
      hasMeal: !!dto.hasMeal,
      transportProvided: !!dto.transportProvided,
      volunteerIds: dto.volunteerIds ?? [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    await this.store.insert('activities', activity);
    return this.toView(activity);
  }

  async setStatus(
    id: string,
    status: Activity['status'],
  ): Promise<ActivityView> {
    await this.get(id);
    const updated = await this.store.update<Activity>('activities', id, {
      status,
    });
    return this.toView(updated);
  }
}
