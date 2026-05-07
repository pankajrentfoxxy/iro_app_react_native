import apiClient from '@/src/api/client';
import type { AuthMeResponse, RegisterPayload } from '@/src/types/auth.types';

export async function requestOtp(phone: string) {
  const { data } = await apiClient.post<{ ok?: boolean; message?: string }>('/auth/otp/request', {
    phone,
  });
  return data;
}

export async function verifyOtp(phone: string, otp: string) {
  const { data } = await apiClient.post<{ token?: string; user?: AuthMeResponse['user'] }>(
    '/auth/otp/verify',
    { phone, otp }
  );
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return data;
}

export async function registerUser(payload: RegisterPayload) {
  const { data } = await apiClient.post<{ user?: AuthMeResponse['user']; token?: string }>(
    '/auth/register',
    payload
  );
  return data;
}
