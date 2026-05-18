import apiClient from '@/src/api/client';

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function getNotifications(): Promise<{ notifications: AppNotification[] }> {
  const { data } = await apiClient.get<{ notifications: AppNotification[] }>('/notifications');
  return data;
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const { data } = await apiClient.patch<{ ok: boolean }>('/notifications/read-all');
  return data;
}
