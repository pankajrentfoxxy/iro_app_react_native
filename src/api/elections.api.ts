import apiClient from '@/src/api/client';

export async function getElections() {
  const { data } = await apiClient.get<{ elections: unknown[] }>('/elections');
  return data;
}

export async function nominateSelf(id: string, statement?: string | null) {
  const { data } = await apiClient.post<{ nominee: unknown }>(`/elections/${id}/nominate`, { statement });
  return data;
}

export async function castElectionVote(id: string, candidateId: string) {
  const { data } = await apiClient.post<{ vote: unknown }>(`/elections/${id}/vote`, {
    candidateId,
  });
  return data;
}

export async function getElectionResults(id: string) {
  const { data } = await apiClient.get<{ results: unknown[] }>(`/elections/${id}/results`);
  return data;
}
