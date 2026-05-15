import apiClient from '@/src/api/client';

export type BoothMoodSentiment = 'SUPPORTIVE' | 'NEUTRAL' | 'OPPOSITION';

export type BoothTaskDto = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  assignedBy?: { id: string; fullName: string } | null;
  assignedTo?: { id: string; fullName: string } | null;
};

export type BoothDashboardDto = {
  booth: {
    id: string;
    boothNumber: string;
    area: string;
    registeredVoters: number;
    reformerCount: number;
    coveragePercent: number;
    mood: { sentiment: BoothMoodSentiment; note: string | null; at: string | null } | null;
  };
  reformers: Array<{
    id: string;
    fullName: string;
    referralCode: string;
    roleLevel: string | null;
    roleName: string | null;
    lastActiveAt: string;
    inactiveAlert: boolean;
  }>;
  tasksDueToday: BoothTaskDto[];
  inactiveCount: number;
};

export type BoothCardDto = BoothDashboardDto['booth'];

/** PRD aggregate — `GET /booths/me` */
export async function fetchMyBoothDashboard(): Promise<BoothDashboardDto> {
  const { data } = await apiClient.get<BoothDashboardDto>('/booths/me');
  return data;
}

/** PRD — `GET /booths/:id` */
export async function fetchBoothById(boothLocationId: string): Promise<{ booth: BoothCardDto }> {
  const { data } = await apiClient.get<{ booth: BoothCardDto }>(`/booths/${boothLocationId}`);
  return data;
}

/** Booth pulse — `PATCH /booths/:id/mood` */
export async function patchBoothMood(
  boothLocationId: string,
  body: { sentiment: BoothMoodSentiment; note?: string | null }
): Promise<{ mood: { sentiment: BoothMoodSentiment | null; note: string | null; at: string } }> {
  const { data } = await apiClient.patch(`/booths/${boothLocationId}/mood`, body);
  return data as {
    mood: { sentiment: BoothMoodSentiment | null; note: string | null; at: string };
  };
}

/** PRD — `GET /users?booth_id=my_booth` */
export async function fetchUsersMyBooth(): Promise<{ users: BoothDashboardDto['reformers'] }> {
  const { data } = await apiClient.get<{ users: BoothDashboardDto['reformers'] }>('/users', {
    params: { booth_id: 'my_booth' },
  });
  return data;
}
