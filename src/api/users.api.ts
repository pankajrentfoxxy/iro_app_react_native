import apiClient from '@/src/api/client';

export type MeStatsResponse = {
  user: {
    id: string;
    name: string;
    role: string;
    roleLevelCode: string | null;
    roleName: string | null;
    stateId: string | null;
    districtId: string | null;
    blockId: string | null;
    directCount: number;
    networkCount: number;
    reformerId: string;
    profilePhotoUrl: string | null;
  };
  xp: {
    totalXP: number;
    level: number;
    streak: number;
    activityScore: number;
    surveyScore: number;
    leadershipScore: number;
  };
  badgeCount: number;
  tasksCompleted: number;
  surveysSubmitted: number;
};

/** GET /users/me/stats */
export async function getMyStats(): Promise<MeStatsResponse> {
  const { data } = await apiClient.get<MeStatsResponse>('/users/me/stats');
  return data;
}

/** GET /users/live-count — public */
export async function getLiveCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/users/live-count');
  return data;
}
