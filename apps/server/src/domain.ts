// 活动报名域：枚举与共享类型

/** 行动能力：自理 / 拄拐 / 助行器 / 轮椅 / 卧床 */
export type MobilityLevel =
  | 'independent'
  | 'cane'
  | 'walker'
  | 'wheelchair'
  | 'bedridden';

export const MOBILITY_OPTIONS: { value: MobilityLevel; label: string }[] = [
  { value: 'independent', label: '自理' },
  { value: 'cane', label: '拄拐' },
  { value: 'walker', label: '使用助行器' },
  { value: 'wheelchair', label: '乘轮椅' },
  { value: 'bedridden', label: '卧床' },
];

/** 活动类别 */
export type ActivityType =
  | 'health_lecture'
  | 'haircut'
  | 'festival_meal'
  | 'other';

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'health_lecture', label: '健康讲座' },
  { value: 'haircut', label: '义剪' },
  { value: 'festival_meal', label: '节日聚餐' },
  { value: 'other', label: '其他' },
];

export type ActivityStatus = 'draft' | 'published' | 'ongoing' | 'finished' | 'cancelled';

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  draft: '草稿',
  published: '报名中',
  ongoing: '进行中',
  finished: '已结束',
  cancelled: '已取消',
};

/** 报名状态 */
export type RegistrationStatus =
  | 'registered' // 已报名（待签到）
  | 'checked_in' // 已签到
  | 'absent' // 缺席
  | 'cancelled'; // 已取消

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  registered: '待签到',
  checked_in: '已签到',
  absent: '缺席',
  cancelled: '已取消',
};

/** 接送需求 */
export interface TransportNeed {
  /** 是否需要接送 */
  required: boolean;
  /** 上车/接人地址 */
  pickupAddress?: string;
  /** 接人时间 HH:mm */
  pickupTime?: string;
  /** 随车联系人电话 */
  contactPhone?: string;
  /** 备注：如需要担架、陪同人数等 */
  remark?: string;
}

/** 老人 */
export interface Elder {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone?: string;
  address?: string;
  /** 紧急联系人 */
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  mobility: MobilityLevel;
  /** 是否需要固定安排轮椅位（日常情况） */
  wheelchairSeat: boolean;
  /** 饮食禁忌，如清真、低糖、低盐、素食、海鲜过敏等 */
  dietaryRestrictions: string[];
  /** 慢性病标签，如高血压、糖尿病 */
  conditions: string[];
  createdAt: string;
}

/** 志愿者 */
export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  /** 是否可驾驶接送车辆 */
  canDrive: boolean;
  /** 可照护的最高行动难度：independent < cane < walker < wheelchair，bedridden 不在普通志愿者范围 */
  maxCareLevel: MobilityLevel;
  /** 服务标签：义剪、医务、陪护、驾驶 */
  skills: string[];
  createdAt: string;
}

/** 活动 */
export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  description?: string;
  location: string;
  /** ISO 时间 */
  startTime: string;
  endTime: string;
  /** 总名额 */
  capacity: number;
  /** 轮椅位数量 */
  wheelchairCapacity: number;
  /** 需接送的预留车位（含轮椅可上车位） */
  transportCapacity: number;
  status: ActivityStatus;
  createdAt: string;
}

/** 活动报名：报名即一次照护档案快照 */
export interface Registration {
  id: string;
  activityId: string;
  elderId: string;
  // ---- 报名时登记的照护信息（快照，活动当天照护依据）----
  mobility: MobilityLevel;
  /** 本场活动是否需要预留轮椅位 */
  needWheelchairSeat: boolean;
  dietaryRestrictions: string[];
  transportNeed: TransportNeed;
  remark?: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
}

/** 照护分工：每条表示“某场活动中某老人由某志愿者负责” */
export interface CareAssignment {
  id: string;
  activityId: string;
  registrationId: string;
  elderId: string;
  volunteerId: string;
  /** 分工内容：wheelchair_assist 轮椅协助 / transport 接送 / meal_assist 用餐照护 / companion 全程陪护 */
  duty: 'wheelchair_assist' | 'transport' | 'meal_assist' | 'companion';
  note?: string;
}

/** 活动参与记录（活动结束后回填，用于后续推荐） */
export interface ParticipationRecord {
  id: string;
  activityId: string;
  registrationId: string;
  elderId: string;
  attended: boolean;
  /** 健康讲座：关注的健康主题 */
  healthTopics?: string[];
  /** 义剪：服务项目，如理发、剃须 */
  haircutServices?: string[];
  /** 聚餐：实际用餐情况，如是否符合饮食禁忌 */
  mealSituation?: string;
  /** 现场健康观察：血压偏高、行走不稳等 */
  healthNote?: string;
  /** 照护反馈 */
  careFeedback?: string;
  /** 志愿者评价等级 1-5 */
  satisfaction?: number;
  filledBy?: string;
  filledAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
}
