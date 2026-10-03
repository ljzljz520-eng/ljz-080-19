const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      data?.message
        ? Array.isArray(data.message)
          ? data.message.join('；')
          : String(data.message)
        : `请求失败（${res.status}）`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  // 活动
  listActivities: (status?: string) =>
    request<import('./types').ActivityView[]>(`/activities${status ? `?status=${status}` : ''}`),
  getActivity: (id: string) => request<import('./types').ActivityView>(`/activities/${id}`),
  createActivity: (body: unknown) =>
    request<import('./types').ActivityView>('/activities', { method: 'POST', body: JSON.stringify(body) }),
  setActivityStatus: (id: string, status: string) =>
    request(`/activities/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // 档案 / 志愿者
  listParticipants: () => request<import('./types').Participant[]>('/participants'),
  listVolunteers: () => request<import('./types').Volunteer[]>('/volunteers'),

  // 报名
  register: (body: unknown) =>
    request<import('./types').Registration>('/registrations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listRegistrations: (params: { activityId?: string; participantId?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    ).toString();
    return request<import('./types').Registration[]>(`/registrations?${qs}`);
  },
  cancelRegistration: (id: string) =>
    request(`/registrations/${id}`, { method: 'DELETE' }),

  // 名单
  activityRoster: (id: string) => request<import('./types').RosterResult>(`/activities/${id}/roster`),
  volunteerRoster: (volunteerId: string, activityId: string) =>
    request<import('./types').RosterResult>(
      `/volunteers/${volunteerId}/roster?activityId=${activityId}`,
    ),

  // 签到
  checkInByCode: (activityId: string, code: string) =>
    request<import('./types').CheckInView>(`/activities/${activityId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  checkInByRegistration: (registrationId: string) =>
    request<import('./types').CheckInView>(`/registrations/${registrationId}/checkin`, {
      method: 'POST',
    }),
  finishActivity: (id: string) =>
    request<{ noShowCount: number }>(`/activities/${id}/finish`, { method: 'POST' }),

  // 参与记录 / 推荐
  backfill: (body: unknown) =>
    request<import('./types').ParticipationRecord>('/participation-records', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  recordsByActivity: (id: string) =>
    request<import('./types').ParticipationRecord[]>(`/activities/${id}/participation-records`),
  recordsByParticipant: (id: string) =>
    request<import('./types').ParticipationRecord[]>(`/participants/${id}/participation-records`),
  recommend: (id: string) =>
    request<import('./types').ServiceRecommendation>(`/participants/${id}/recommendations`),
};
