import type { ActivityType, MobilityLevel, RegistrationStatus, TransportNeed } from './types';

export const MOBILITY_OPTIONS: { value: MobilityLevel; label: string; color: string; desc: string }[] = [
  { value: 'independent', label: '完全自理', color: '#52c41a', desc: '可独立行走、上下楼' },
  { value: 'slow', label: '行动迟缓', color: '#faad14', desc: '能自行行走，但步速慢、易疲劳' },
  { value: 'walker', label: '需助行器/搀扶', color: '#fa8c16', desc: '需要助行器或他人搀扶' },
  { value: 'wheelchair', label: '依靠轮椅', color: '#f5222d', desc: '需预留轮椅位与无障碍通道' },
];

export const MOBILITY_MAP = Object.fromEntries(MOBILITY_OPTIONS.map((o) => [o.value, o]));

export const TRANSPORT_OPTIONS: { value: TransportNeed; label: string; desc: string }[] = [
  { value: 'none', label: '自行前往', desc: '不需要接送' },
  { value: 'pickup', label: '只需接来', desc: '活动开始前接到现场，散场自行回家' },
  { value: 'round_trip', label: '往返接送', desc: '接来并送回，志愿者全程陪同' },
];
export const TRANSPORT_MAP = Object.fromEntries(TRANSPORT_OPTIONS.map((o) => [o.value, o]));

export const DIET_SUGGESTIONS = ['低糖', '低盐', '低脂', '软烂易嚼', '清淡', '素食', '忌海鲜', '忌辛辣', '忌牛羊肉'];

export const ACTIVITY_TYPE_META: Record<ActivityType, { label: string; emoji: string; color: string }> = {
  health_talk: { label: '健康讲座', emoji: '🩺', color: '#1677ff' },
  haircut: { label: '义剪服务', emoji: '✂️', color: '#722ed1' },
  dinner: { label: '节日聚餐', emoji: '🍲', color: '#fa541c' },
  other: { label: '社区活动', emoji: '🤝', color: '#13c2c2' },
};

export const STATUS_META: Record<RegistrationStatus, { label: string; color: string }> = {
  registered: { label: '已报名', color: '#1677ff' },
  checked_in: { label: '已签到', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#999' },
  no_show: { label: '未到场', color: '#f5222d' },
};
