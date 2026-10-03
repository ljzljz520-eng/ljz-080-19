export type MobilityLevel = 'independent' | 'slow' | 'walker' | 'wheelchair';
export type ActivityType = 'health_talk' | 'haircut' | 'dinner' | 'other';
export type ActivityStatus = 'open' | 'ongoing' | 'finished';
export type TransportNeed = 'none' | 'pickup' | 'round_trip';
export type RegistrationStatus = 'registered' | 'checked_in' | 'cancelled' | 'no_show';

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  careElderIds: string[];
}

export interface Participant {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  address: string;
  mobility: MobilityLevel;
  dietaryRestrictions: string[];
  healthNote?: string;
  emergencyContact: { name: string; phone: string };
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

export interface Registration {
  id: string;
  activityId: string;
  participantId: string;
  mobility: MobilityLevel;
  wheelchairSeat: boolean;
  dietaryRestrictions: string[];
  transportNeed: TransportNeed;
  transportAddress?: string;
  careNote?: string;
  emergencyContact: { name: string; phone: string };
  status: RegistrationStatus;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  registeredAt: string;
  checkedInAt?: string;
  checkInCode: string;
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

export interface RosterResult {
  activityId: string;
  rows: RosterRow[];
  summary: { total: number; checkedIn: number; wheelchair: number; needTransport: number };
}

export interface ParticipationRecord {
  id: string;
  activityId: string;
  participantId: string;
  registrationId: string;
  attended: boolean;
  usedWheelchairSeat: boolean;
  usedTransport: boolean;
  mealNote?: string;
  careSummary?: string;
  tags: string[];
  createdAt: string;
  participantName?: string;
}

export interface ServiceRecommendation {
  participantId: string;
  reason: string;
  suggestedActivities: { activityId: string; title: string; type: ActivityType; match: number }[];
}

export interface CheckInView extends Registration {
  participant: Participant;
  assignedVolunteerName?: string;
}
