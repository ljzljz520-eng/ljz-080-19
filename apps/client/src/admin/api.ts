import { api } from '../api/client';
import type {
  Activity,
  Elder,
  ParticipationRecord,
  Registration,
  Volunteer,
} from '../api/types';

export interface CheckinDesk {
  activity: Activity;
  total: number;
  checkedInCount: number;
  pending: any[];
  checkedIn: any[];
}

export interface Recommendation {
  elder: Pick<Elder, 'id' | 'name' | 'age' | 'mobility' | 'dietaryRestrictions' | 'conditions'>;
  stats: { participated: number; absent: number; avgSatisfaction: number | null };
  careTips: { type: string; level: 'info' | 'suggest' | 'attention'; text: string }[];
  recommendations: { type: string; title: string; reason: string }[];
  openActivities: {
    activityId: string;
    title: string;
    type: string;
    startTime: string;
    location: string;
    reason?: string;
    alreadyRegistered: boolean;
  }[];
}

export const adminApi = {
  activities: () => api.get<Activity[]>('/activities'),
  activity: (id: string) => api.get<Activity>(`/activities/${id}`),
  activityDetail: (id: string) =>
    api.get<{ activity: Activity; registrations: Registration[] }>(`/activities/${id}/detail`),
  createActivity: (body: unknown) => api.post<Activity>('/activities', body),
  transition: (id: string, action: 'start' | 'finish' | 'cancel') =>
    api.patch<Activity>(`/activities/${id}/transition`, { action }),
  register: (body: unknown) => api.post<Registration>('/registrations', body),
  cancelReg: (id: string, reason?: string) =>
    api.post<Registration>(`/registrations/${id}/cancel`, { reason }),
  assign: (registrationId: string, body: unknown) =>
    api.post<Registration>(`/registrations/${registrationId}/assign`, body),
  unassign: (assignmentId: string) =>
    api.delete<{ ok: boolean }>(`/registrations/assignments/${assignmentId}`),
  checkin: (activityId: string, elderId: string) =>
    api.post<{ ok: boolean }>(`/activities/${activityId}/checkin`, { elderId }),
  undoCheckin: (registrationId: string) =>
    api.post<{ ok: boolean }>(`/checkins/${registrationId}/undo`),
  desk: (activityId: string) =>
    api.get<CheckinDesk>(`/activities/${activityId}/checkin-desk`),
  fillRecord: (registrationId: string, body: unknown) =>
    api.post<ParticipationRecord>(`/records/registrations/${registrationId}`, body),
  recordsOfElder: (elderId: string) =>
    api.get<ParticipationRecord[]>(`/records?elderId=${elderId}`),
  recommend: (elderId: string) =>
    api.get<Recommendation>(`/records/elders/${elderId}/recommend`),
  elders: () => api.get<Elder[]>('/elders'),
  createElder: (body: unknown) => api.post<Elder>('/elders', body),
  volunteers: () => api.get<Volunteer[]>('/volunteers'),
};
