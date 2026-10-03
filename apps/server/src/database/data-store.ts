import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Activity,
  ParticipationRecord,
  Participant,
  Registration,
  Volunteer,
} from '../domain';

/**
 * 数据访问层：
 * - 配置了真实 SUPABASE_URL/SUPABASE_KEY 时使用 Supabase Postgres。
 * - 未配置（本地/演示）时自动降级为内存存储，并注入种子数据，
 *   保证整套报名-签到-回填流程开箱可演示。
 */
@Injectable()
export class DataStore implements OnModuleInit {
  private readonly logger = new Logger(DataStore.name);
  private supabase?: SupabaseClient;
  private memory!: Record<string, unknown[]>;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    const configured = url && key && !url.includes('placeholder');
    if (configured) {
      this.supabase = createClient(url, key);
      this.logger.log('使用 Supabase Postgres 存储');
    } else {
      this.logger.warn('未配置 Supabase，使用内存存储（演示模式）');
      this.memory = seed();
    }
  }

  async list<T>(table: string): Promise<T[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase.from(table).select('*');
      if (error) throw new Error(`读取 ${table} 失败: ${error.message}`);
      return (data ?? []) as T[];
    }
    return (this.memory[table] ?? []) as T[];
  }

  async insert<T extends { id: string }>(table: string, row: T): Promise<T> {
    if (this.supabase) {
      const result = await this.supabase
        .from(table)
        .insert(row)
        .select()
        .single();
      if (result.error)
        throw new Error(`写入 ${table} 失败: ${result.error.message}`);
      return result.data as T;
    }
    (this.memory[table] ??= []).push(row);
    return row;
  }

  async update<T extends { id: string }>(
    table: string,
    id: string,
    patch: Partial<T>,
  ): Promise<T> {
    if (this.supabase) {
      const result = await this.supabase
        .from(table)
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (result.error)
        throw new Error(`更新 ${table} 失败: ${result.error.message}`);
      return result.data as T;
    }
    const rows = this.memory[table] ?? [];
    const idx = rows.findIndex((r) => (r as { id: string }).id === id);
    if (idx < 0) throw new Error(`${table} 中不存在 ${id}`);
    rows[idx] = {
      ...(rows[idx] as Record<string, unknown>),
      ...patch,
    } as unknown;
    return rows[idx] as T;
  }
}

const now = Date.now();
const iso = (offsetHour: number) =>
  new Date(now + offsetHour * 3600_000).toISOString();

function seed(): Record<string, unknown[]> {
  const volunteers: Volunteer[] = [
    {
      id: 'v1',
      name: '李明（志愿者）',
      phone: '13800000001',
      careElderIds: ['p1', 'p2'],
    },
    {
      id: 'v2',
      name: '王芳（志愿者）',
      phone: '13800000002',
      careElderIds: ['p3'],
    },
  ];

  const participants: Participant[] = [
    {
      id: 'p1',
      name: '张桂兰',
      gender: 'female',
      age: 78,
      phone: '13911110001',
      address: '幸福里小区 3 栋 201',
      mobility: 'slow',
      dietaryRestrictions: ['低糖', '软烂易嚼'],
      healthNote: '糖尿病，需按时服药',
      emergencyContact: { name: '张建国（儿子）', phone: '13700001111' },
    },
    {
      id: 'p2',
      name: '赵德海',
      gender: 'male',
      age: 84,
      phone: '13911110002',
      address: '幸福里小区 1 栋 102',
      mobility: 'wheelchair',
      dietaryRestrictions: ['低盐'],
      healthNote: '中风后康复期，右肢活动不便',
      emergencyContact: { name: '赵小敏（女儿）', phone: '13700002222' },
    },
    {
      id: 'p3',
      name: '孙秀珍',
      gender: 'female',
      age: 71,
      phone: '13911110003',
      address: '和平街 12 号院',
      mobility: 'independent',
      dietaryRestrictions: ['忌海鲜'],
      healthNote: '对海鲜过敏',
      emergencyContact: { name: '孙强（儿子）', phone: '13700003333' },
    },
    {
      id: 'p4',
      name: '陈守业',
      gender: 'male',
      age: 80,
      phone: '13911110004',
      address: '幸福里小区 5 栋 303',
      mobility: 'walker',
      dietaryRestrictions: [],
      healthNote: '听力较弱，交流需放慢语速',
      emergencyContact: { name: '陈丽（女儿）', phone: '13700004444' },
    },
  ];

  const activities: Activity[] = [
    {
      id: 'a1',
      title: '秋季心脑血管健康讲座',
      type: 'health_talk',
      description: '社区医院主任医师讲解换季心脑血管保养，现场免费测血压血糖。',
      location: '社区活动中心一楼多功能厅',
      startTime: iso(26),
      endTime: iso(28),
      capacity: 40,
      wheelchairSpots: 6,
      hasMeal: false,
      transportProvided: true,
      volunteerIds: ['v1', 'v2'],
      status: 'open',
      createdAt: iso(-20),
    },
    {
      id: 'a2',
      title: '关爱从头开始·公益义剪',
      type: 'haircut',
      description: '理发师志愿者为老人免费理发剃须，行动不便者可优先安排。',
      location: '社区养老服务站',
      startTime: iso(50),
      endTime: iso(53),
      capacity: 25,
      wheelchairSpots: 4,
      hasMeal: false,
      transportProvided: true,
      volunteerIds: ['v1'],
      status: 'open',
      createdAt: iso(-10),
    },
    {
      id: 'a3',
      title: '重阳敬老节日聚餐',
      type: 'dinner',
      description: '重阳家宴，按老人饮食禁忌备餐，轮椅席位与接送已安排。',
      location: '社区食堂二楼',
      startTime: iso(120),
      endTime: iso(123),
      capacity: 60,
      wheelchairSpots: 10,
      hasMeal: true,
      transportProvided: true,
      volunteerIds: ['v1', 'v2'],
      status: 'open',
      createdAt: iso(-5),
    },
  ];

  const registrations: Registration[] = [
    {
      id: 'r1',
      activityId: 'a1',
      participantId: 'p1',
      mobility: 'slow',
      wheelchairSeat: false,
      dietaryRestrictions: ['低糖'],
      transportNeed: 'round_trip',
      transportAddress: '幸福里小区 3 栋 201',
      careNote: '讲座结束前提醒服药',
      emergencyContact: { name: '张建国（儿子）', phone: '13700001111' },
      status: 'registered',
      assignedVolunteerId: 'v1',
      registeredAt: iso(-18),
      checkInCode: '482910',
    },
    {
      id: 'r2',
      activityId: 'a1',
      participantId: 'p2',
      mobility: 'wheelchair',
      wheelchairSeat: true,
      dietaryRestrictions: ['低盐'],
      transportNeed: 'round_trip',
      transportAddress: '幸福里小区 1 栋 102',
      careNote: '需协助上下车坡道',
      emergencyContact: { name: '赵小敏（女儿）', phone: '13700002222' },
      status: 'registered',
      assignedVolunteerId: 'v1',
      registeredAt: iso(-17),
      checkInCode: '736502',
    },
    {
      id: 'r3',
      activityId: 'a3',
      participantId: 'p3',
      mobility: 'independent',
      wheelchairSeat: false,
      dietaryRestrictions: ['忌海鲜'],
      transportNeed: 'none',
      emergencyContact: { name: '孙强（儿子）', phone: '13700003333' },
      status: 'registered',
      assignedVolunteerId: 'v2',
      registeredAt: iso(-4),
      checkInCode: '205847',
    },
  ];

  return {
    volunteers,
    participants,
    activities,
    registrations,
    participation_records: [] as ParticipationRecord[],
  };
}
