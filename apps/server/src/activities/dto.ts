import { ACTIVITY_TYPE_LABEL, ActivityStatus, ActivityType } from '../domain';

export class CreateActivityDto {
  title!: string;
  type!: ActivityType;
  description?: string;
  location!: string;
  startTime!: string;
  endTime!: string;
  capacity!: number;
  wheelchairSpots!: number;
  hasMeal!: boolean;
  transportProvided!: boolean;
  volunteerIds?: string[];
}

export interface ActivityStats {
  registeredCount: number;
  checkedInCount: number;
  wheelchairSeatTaken: number;
  transportCount: number;
  remaining: number;
  wheelchairRemaining: number;
}

export interface ActivityView {
  id: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  wheelchairSpots: number;
  hasMeal: boolean;
  transportProvided: boolean;
  volunteerIds: string[];
  status: ActivityStatus;
  createdAt: string;
  stats: ActivityStats;
}

export function typeLabelOf(type: ActivityType): string {
  return ACTIVITY_TYPE_LABEL[type] ?? '社区活动';
}
