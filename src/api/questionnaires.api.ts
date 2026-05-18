import apiClient from '@/src/api/client';

export type QuestionnaireCampaign = {
  id: string;
  title: string;
  type: string;
  questions: unknown;
  targetRoleLevel: string | null;
  boothHierarchyId: string | null;
  dueDate: string | null;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
  completed?: boolean;
  responseCount?: number;
};

/** GET /surveys — dynamic questionnaires */
export async function fetchQuestionnaireCampaigns(): Promise<QuestionnaireCampaign[]> {
  const { data } = await apiClient.get<{ surveys: QuestionnaireCampaign[] }>('/surveys');
  return data.surveys ?? [];
}

/** POST /surveys/:id/respond */
export async function submitQuestionnaireResponse(
  id: string,
  body: { answers: Record<string, unknown>; gpsLat?: number | null; gpsLong?: number | null }
) {
  const { data } = await apiClient.post<{ response: unknown }>(`/surveys/${id}/respond`, body);
  return data;
}

/** POST /surveys/batch — offline sync */
export async function batchSyncQuestionnaires(
  responses: Array<{
    surveyId: string;
    answers: Record<string, unknown>;
    gpsLat?: number | null;
    gpsLong?: number | null;
  }>
): Promise<{ synced: number }> {
  const { data } = await apiClient.post<{ synced: number }>('/surveys/batch', { responses });
  return data;
}
