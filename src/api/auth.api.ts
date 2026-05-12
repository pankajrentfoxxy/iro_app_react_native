import apiClient from '@/src/api/client';
import type { IroPublicUser } from '@/src/lib/iroUser';

/** POST /auth/otp/request */
export async function requestOtp(phone: string): Promise<{ sent: boolean; expiresIn: number }> {
  const { data } = await apiClient.post<{ sent: boolean; expiresIn: number }>('/auth/otp/request', {
    phone,
  });
  return data;
}

export type VerifyOtpResult =
  | { needsRegistration: true; registerToken: string }
  | {
      needsRegistration: false;
      user: IroPublicUser;
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };

/** POST /auth/otp/verify */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const { data } = await apiClient.post<VerifyOtpResult>('/auth/otp/verify', {
    phone,
    code,
  });
  return data;
}

/** GET /auth/me */
export async function fetchMe(): Promise<IroPublicUser> {
  const { data } = await apiClient.get<IroPublicUser>('/auth/me');
  return data;
}

export type ReferralTreeNode = {
  id: string;
  name: string;
  role: string;
  children?: ReferralTreeNode[];
};

/** GET /auth/me/referrals/tree — nested invitees (`referredById`) */
export async function fetchReferralTree(): Promise<{ tree: ReferralTreeNode }> {
  const { data } = await apiClient.get<{ tree: ReferralTreeNode }>('/auth/me/referrals/tree');
  return data;
}

/** PATCH /auth/me */
export type UpdateProfileBody = {
  fullName?: string;
  dob?: string;
  gender?: string;
  village?: string;
  pincode?: string;
  occupation?: string;
  education?: string;
  stateName?: string;
  districtName?: string;
  blockName?: string;
};

export async function updateProfile(body: UpdateProfileBody): Promise<IroPublicUser> {
  const { data } = await apiClient.patch<IroPublicUser>('/auth/me', body);
  return data;
}

/** Body for POST /auth/register */
export type IroRegisterBody = {
  registerToken: string;
  phone: string;
  fullName: string;
  dob: string;
  gender: string;
  village: string;
  pincode: string;
  occupation: string;
  education: string;
  stateName: string;
  districtName: string;
  blockName: string;
  email?: string | null;
  password?: string | null;
  referralCode?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  blockId?: string | null;
  boothId?: string | null;
};

/** POST /auth/register */
export async function registerUser(
  body: IroRegisterBody
): Promise<{ user: IroPublicUser; accessToken: string; refreshToken: string; expiresIn: string }> {
  const { data } = await apiClient.post<{
    user: IroPublicUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }>('/auth/register', body);

  return data;
}
