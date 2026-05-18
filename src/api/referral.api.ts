import apiClient from '@/src/api/client';

export async function getReferralStats(): Promise<{
  directCount: number;
  networkCount: number;
  reformerId: string;
}> {
  const { data } = await apiClient.get<{
    directCount: number;
    networkCount: number;
    reformerId: string;
  }>('/referral/stats');
  return data;
}

export async function getLeaderboard(params?: Record<string, string | undefined>) {
  const { data } = await apiClient.get<{ leaderboard: unknown[] }>('/referral/leaderboard', { params });
  return data;
}
