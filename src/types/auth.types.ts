import type { UserProfile } from '@/src/types/user.types';

export interface AuthMeResponse {
  user: UserProfile;
}

export interface RegisterPayload {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  state: string;
  district: string;
  block: string;
  village: string;
  pincode: string;
  occupation: string;
  education: string;
  referralCode?: string;
}
