export type MobilityLevel = 'independent' | 'cane' | 'walker' | 'wheelchair' | 'bedridden';
export type ActivityType = 'health_lecture' | 'haircut' | 'festival_meal' | 'other';
export type ActivityStatus = 'draft' | 'published' | 'ongoing' | 'finished' | 'cancelled';
export type RegistrationStatus = 'registered' | 'checked_in' | 'absent' | 'cancelled';

export interface TransportNeed {
  required: boolean;
  pickupAddress?: string;
  pickupTime?: string;
  contactPhone?: string;
  remark?: string;
}

export interface Elder {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  mobility: MobilityLevel;
  wheelchairSeat: boolean;
  dietaryRestrictions: string[];
  conditions: string[];
  createdAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  canDrive: boolean;
  maxCareLevel: MobilityLevel;
  skills: string[];
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  description?: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  wheelchairCapacity: number;
  transportCapacity: number;
  status: ActivityStatus;
  registeredCount?: number;
  wheelchairUsed?: number;
  transportUsed?: number;
}

export interface AssignmentView {
  assignmentId: string;
  duty: 'wheelchair_assist' | 'transport' | 'meal_assist' | 'companion';
  note?: string;
  volunteer?: Volunteer;
}

export interface Registration {
  id: string;
  activityId: string;
  elderId: string;
  mobility: MobilityLevel;
  needWheelchairSeat: boolean;
  dietaryRestrictions: string[];
  transportNeed: TransportNeed;
  remark?: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  elder?: Elder;
  activity?: Activity;
  volunteers?: AssignmentView[];
  record?: ParticipationRecord;
}

export interface ParticipationRecord {
  id: string;
  activityId: string;
  registrationId: string;
  elderId: string;
  attended: boolean;
  healthTopics?: string[];
  haircutServices?: string[];
  mealSituation?: string;
  healthNote?: string;
  careFeedback?: string;
  satisfaction?: number;
  filledBy?: string;
  filledAt: string;
  activity?: Activity;
  elder?: Elder;
}

export const MOBILITY_MAP: Record<MobilityLevel, string> = {
  independent: '自理',
  cane: '拄拐',
  walker: '助行器',
  wheelchair: '乘轮椅',
  bedridden: '卧床',
};

export const ACTIVITY_TYPE_MAP: Record<ActivityType, string> = {
  health_lecture: '健康讲座',
  haircut: '义剪',
  festival_meal: '节日聚餐',
  other: '其他',
};

export const ACTIVITY_STATUS_MAP: Record<ActivityStatus, string> = {
  draft: '草稿',
  published: '报名中',
  ongoing: '进行中',
  finished: '已结束',
  cancelled: '已取消',
};

export const REGISTRATION_STATUS_MAP: Record<RegistrationStatus, string> = {
  registered: '待签到',
  checked_in: '已签到',
  absent: '缺席',
  cancelled: '已取消',
};

export const DUTY_MAP = {
  wheelchair_assist: '轮椅协助',
  transport: '接送',
  meal_assist: '用餐照护',
  companion: '全程陪护',
} as const;

export const DIET_OPTIONS = ['低糖', '低盐', '低脂', '软食', '流食', '清真', '素食', '海鲜过敏', '坚果过敏', '辛辣禁忌'];

export const MOBILITY_ORDER: MobilityLevel[] = ['independent', 'cane', 'walker', 'wheelchair', 'bedridden'];
