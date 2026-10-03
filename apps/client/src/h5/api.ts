import { api } from '../api/client';
import type {
  Activity,
  Elder,
  ParticipationRecord,
  Registration,
  Volunteer,
} from '../api/types';

export interface RosterElder {
  assignmentId: string;
  duty: string;
  dutyLabel: string;
  assignmentNote?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  status: string;
  elder: {
    id: string;
    name: string;
    gender: string;
    age: number;
    phone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    conditions: string[];
  };
  care: {
    mobility: string;
    needWheelchairSeat: boolean;
    dietaryRestrictions: string[];
    transportNeed: {
      required: boolean;
      pickupAddress?: string;
      pickupTime?: string;
      contactPhone?: string;
      remark?: string;
    };
    remark?: string;
  };
}

export const h5Api = {
  activities: () => api.get<Activity[]>('/activities'),
  activity: (id: string) => api.get<Activity>(`/activities/${id}`),
  elders: () => api.get<Elder[]>('/elders'),
  volunteers: () => api.get<Volunteer[]>('/volunteers'),
  register: (body: unknown) => api.post<Registration>('/registrations', body),
  cancel: (id: string, reason?: string) =>
    api.post<Registration>(`/registrations/${id}/cancel`, { reason }),
  myRegistrations: (elderId: string) =>
    api.get<Registration[]>(`/registrations?elderId=${elderId}`),
  roster: (activityId: string, volunteerId: string) =>
    api.get<{
      activity: Activity;
      volunteer: Volunteer;
      totalAssigned: number;
      checkedInCount: number;
      elders: RosterElder[];
    }>(`/activities/${activityId}/roster?volunteerId=${volunteerId}`),
  recordsOfElder: (elderId: string) =>
    api.get<ParticipationRecord[]>(`/records?elderId=${elderId}`),
};
