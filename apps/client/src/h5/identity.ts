// H5 端身份切换（演示用，未接入登录）：老人/家属 or 志愿者
import type { Elder, Volunteer } from '../api/types';

const KEY_ELDER = 'h5.elderId';
const KEY_VOLUNTEER = 'h5.volunteerId';
const KEY_ROLE = 'h5.role';

export type Role = 'elder' | 'volunteer';

export const identity = {
  role(): Role {
    return (localStorage.getItem(KEY_ROLE) as Role) || 'elder';
  },
  setRole(role: Role) {
    localStorage.setItem(KEY_ROLE, role);
  },
  elderId() {
    return localStorage.getItem(KEY_ELDER) || '';
  },
  setElder(id: string) {
    localStorage.setItem(KEY_ELDER, id);
  },
  volunteerId() {
    return localStorage.getItem(KEY_VOLUNTEER) || '';
  },
  setVolunteer(id: string) {
    localStorage.setItem(KEY_VOLUNTEER, id);
  },
};

export function currentElderName(elders: Elder[]) {
  return elders.find((e) => e.id === identity.elderId())?.name;
}
export function currentVolunteer(volunteers: Volunteer[]) {
  return volunteers.find((v) => v.id === identity.volunteerId());
}
