import apiClient from '@/src/api/client';
import type { BoothTaskDto } from '@/src/api/booth.api';

export type CompleteTaskBody = {
  gpsLat?: number | null;
  gpsLong?: number | null;
  proofImageUrl?: string | null;
};

/** `GET /tasks` — supports PRD `assigned_to=me&due_today=true` */
export async function fetchTasks(params?: {
  status?: string;
  assigned_to?: 'me';
  due_today?: boolean;
}): Promise<{ tasks: BoothTaskDto[] }> {
  const { data } = await apiClient.get<{ tasks: BoothTaskDto[] }>('/tasks', {
    params: {
      ...params,
      due_today: params?.due_today === true ? 'true' : undefined,
    },
  });
  return data;
}

/** `PATCH /tasks/:id/complete` */
export async function completeTask(taskId: string, body: CompleteTaskBody = {}): Promise<{ task: BoothTaskDto }> {
  const { data } = await apiClient.patch<{ task: BoothTaskDto }>(`/tasks/${taskId}/complete`, body);
  return data;
}
