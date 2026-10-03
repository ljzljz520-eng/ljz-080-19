// 活动报名领域模型

/** 行动能力等级 */
export type MobilityLevel = 'independent' | 'slow' | 'walker' | 'wheelchair';

export const MOBILITY_LABEL: Record<MobilityLevel, string> = {
  independent: '完全自理',
  slow: '行动迟缓，可自行行走',
  walker: '需助行器/人搀扶',
  wheelchair: '依靠轮椅',
};

/** 活动类型 */
export type ActivityType = 'health_talk' | 'haircut' | 'dinner' | 'other';

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  health_talk: '健康讲座',
  haircut: '义剪服务',
  dinner: '节日聚餐',
  other: '社区活动',
};

/** 活动状态 */
export type ActivityStatus = 'open' | 'ongoing' | 'finished';

/** 接送需求 */
export type TransportNeed = 'none' | 'pickup' | 'round_trip';

export const TRANSPORT_LABEL: Record<TransportNeed, string> = {
  none: '不需要接送',
  pickup: '需要接来',
  round_trip: '需要往返接送',
};

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  /** 今天负责照护的老人 id 列表（默认照护关系） */
  careElderIds: string[];
}

export interface Participant {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  address: string;
  /** 行动能力 */
  mobility: MobilityLevel;
  /** 饮食禁忌，如 ['低糖','忌海鲜'] */
  dietaryRestrictions: string[];
  /** 慢性病/健康备注 */
  healthNote?: string;
  /** 紧急联系人及电话 */
  emergencyContact: { name: string; phone: string };
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  description: string;
  location: string;
  startTime: string; // ISO
  endTime: string; // ISO
  capacity: number;
  /** 轮椅位数量 */
  wheelchairSpots: number;
  /** 是否提供餐饮（决定是否重点关注饮食禁忌） */
  hasMeal: boolean;
  /** 是否提供接送 */
  transportProvided: boolean;
  /** 负责志愿者 id 列表 */
  volunteerIds: string[];
  status: ActivityStatus;
  createdAt: string;
}

export type RegistrationStatus =
  | 'registered'
  | 'checked_in'
  | 'cancelled'
  | 'no_show';

export interface Registration {
  id: string;
  activityId: string;
  participantId: string;
  /** 报名时登记的照护信息（允许针对本次活动更新） */
  mobility: MobilityLevel;
  wheelchairSeat: boolean;
  dietaryRestrictions: string[];
  transportNeed: TransportNeed;
  /** 接送地址（默认同住址，可改） */
  transportAddress?: string;
  careNote?: string;
  emergencyContact: { name: string; phone: string };
  status: RegistrationStatus;
  /** 负责签到当天照护的志愿者 */
  assignedVolunteerId?: string;
  registeredAt: string;
  checkedInAt?: string;
  /** 6 位取号码，老人到场报号即可签到 */
  checkInCode: string;
}

/** 活动结束后回填的参与记录 */
export interface ParticipationRecord {
  id: string;
  activityId: string;
  participantId: string;
  registrationId: string;
  attended: boolean;
  /** 实际使用轮椅位 */
  usedWheelchairSeat: boolean;
  /** 实际是否使用接送 */
  usedTransport: boolean;
  /** 用餐情况，聚餐活动用 */
  mealNote?: string;
  /** 志愿者照护备注（活动表现、突发情况等） */
  careSummary?: string;
  /** 服务标签，用于后续推荐 */
  tags: string[];
  createdAt: string;
}

/** 给某位老人的后续服务推荐 */
export interface ServiceRecommendation {
  participantId: string;
  reason: string;
  suggestedActivities: {
    activityId: string;
    title: string;
    type: ActivityType;
    match: number;
  }[];
}

export interface RosterRow {
  registrationId: string;
  participant: Participant;
  mobility: MobilityLevel;
  wheelchairSeat: boolean;
  dietaryRestrictions: string[];
  transportNeed: TransportNeed;
  transportAddress?: string;
  careNote?: string;
  emergencyContact: { name: string; phone: string };
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
}
