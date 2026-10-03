import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Activity,
  CareAssignment,
  Elder,
  ParticipationRecord,
  Registration,
  Volunteer,
} from '../domain';

/**
 * 轻量内存数据存储。
 * 表结构与 supabase/schema.sql 一一对应；接入真实 Supabase 时，
 * 将各 Repository 的读写替换为 supabase-js 查询即可，领域模型不变。
 */
@Injectable()
export class StoreService implements OnModuleInit {
  elders: Elder[] = [];
  volunteers: Volunteer[] = [];
  activities: Activity[] = [];
  registrations: Registration[] = [];
  assignments: CareAssignment[] = [];
  records: ParticipationRecord[] = [];

  onModuleInit() {
    this.seed();
  }

  uuid(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
      .toString(36)
      .slice(-4)}`;
  }

  private seed() {
    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const dayAfter = (days: number, h: number, m = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      d.setHours(h, m, 0, 0);
      return iso(d);
    };

    this.elders = [
      {
        id: 'el_001',
        name: '王桂兰',
        gender: 'female',
        age: 78,
        phone: '13800000001',
        address: '幸福里社区 3 栋 2 单元 301',
        emergencyContactName: '王强（子）',
        emergencyContactPhone: '13900000001',
        mobility: 'walker',
        wheelchairSeat: false,
        dietaryRestrictions: ['低糖', '软食'],
        conditions: ['糖尿病', '高血压'],
        createdAt: iso(now),
      },
      {
        id: 'el_002',
        name: '李建国',
        gender: 'male',
        age: 82,
        phone: '13800000002',
        address: '幸福里社区 1 栋 1 单元 102',
        emergencyContactName: '李梅（女）',
        emergencyContactPhone: '13900000002',
        mobility: 'wheelchair',
        wheelchairSeat: true,
        dietaryRestrictions: ['低盐'],
        conditions: ['脑梗康复期'],
        createdAt: iso(now),
      },
      {
        id: 'el_003',
        name: '张秀珍',
        gender: 'female',
        age: 71,
        phone: '13800000003',
        address: '幸福里社区 5 栋 3 单元 501',
        mobility: 'independent',
        wheelchairSeat: false,
        dietaryRestrictions: ['清真'],
        conditions: [],
        createdAt: iso(now),
      },
      {
        id: 'el_004',
        name: '赵德海',
        gender: 'male',
        age: 85,
        phone: '13800000004',
        address: '幸福里社区 2 栋 1 单元 203',
        emergencyContactName: '赵磊（孙）',
        emergencyContactPhone: '13900000004',
        mobility: 'cane',
        wheelchairSeat: false,
        dietaryRestrictions: ['海鲜过敏'],
        conditions: ['冠心病'],
        createdAt: iso(now),
      },
      {
        id: 'el_005',
        name: '孙丽华',
        gender: 'female',
        age: 69,
        address: '幸福里社区 6 栋 2 单元 402',
        mobility: 'independent',
        wheelchairSeat: false,
        dietaryRestrictions: ['素食'],
        conditions: [],
        createdAt: iso(now),
      },
    ];

    this.volunteers = [
      {
        id: 'vo_001',
        name: '陈晨',
        phone: '13711110001',
        canDrive: true,
        maxCareLevel: 'wheelchair',
        skills: ['驾驶', '陪护', '轮椅协助'],
        createdAt: iso(now),
      },
      {
        id: 'vo_002',
        name: '刘洋',
        phone: '13711110002',
        canDrive: false,
        maxCareLevel: 'walker',
        skills: ['陪护', '义剪助理'],
        createdAt: iso(now),
      },
      {
        id: 'vo_003',
        name: '周敏',
        phone: '13711110003',
        canDrive: false,
        maxCareLevel: 'wheelchair',
        skills: ['医务', '陪护'],
        createdAt: iso(now),
      },
    ];

    this.activities = [
      {
        id: 'ac_001',
        title: '秋季老年健康讲座：糖尿病饮食管理',
        type: 'health_lecture',
        description: '社区卫生服务中心主任医师主讲，课后提供免费血糖测量。',
        location: '幸福里社区活动中心 一层多功能厅',
        startTime: dayAfter(2, 9, 30),
        endTime: dayAfter(2, 11, 0),
        capacity: 40,
        wheelchairCapacity: 6,
        transportCapacity: 8,
        status: 'published',
        createdAt: iso(now),
      },
      {
        id: 'ac_002',
        title: '爱在重阳·爱心义剪日',
        type: 'haircut',
        description: '专业理发师志愿者为老人免费理发、剃须，行动不便老人可安排上门。',
        location: '幸福里社区活动中心 二层 203',
        startTime: dayAfter(5, 14, 0),
        endTime: dayAfter(5, 16, 30),
        capacity: 30,
        wheelchairCapacity: 4,
        transportCapacity: 6,
        status: 'published',
        createdAt: iso(now),
      },
      {
        id: 'ac_003',
        title: '中秋邻里聚餐宴',
        type: 'festival_meal',
        description: '社区邻里共聚，菜单可按饮食禁忌单独备餐（低糖/低盐/清真/素食）。',
        location: '幸福里社区食堂',
        startTime: dayAfter(9, 11, 30),
        endTime: dayAfter(9, 13, 30),
        capacity: 50,
        wheelchairCapacity: 8,
        transportCapacity: 10,
        status: 'published',
        createdAt: iso(now),
      },
    ];

    this.registrations = [];
    this.assignments = [];
    this.records = [];
  }
}
