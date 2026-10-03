import { MobilityLevel, RosterRow, TransportNeed } from '../domain';

export class CreateRegistrationDto {
  activityId!: string;
  /** 已有档案时传 */
  participantId?: string;
  /** 现场为新老人建档时传 */
  newParticipant?: {
    name: string;
    gender: 'male' | 'female';
    age: number;
    phone: string;
    address: string;
    healthNote?: string;
  };
  mobility!: MobilityLevel;
  wheelchairSeat!: boolean;
  dietaryRestrictions!: string[];
  transportNeed!: TransportNeed;
  transportAddress?: string;
  careNote?: string;
  emergencyContact!: { name: string; phone: string };
}

export interface RosterResult {
  activityId: string;
  rows: RosterRow[];
  summary: {
    total: number;
    checkedIn: number;
    wheelchair: number;
    needTransport: number;
  };
}
