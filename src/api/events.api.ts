import apiClient from '@/src/api/client';

export async function getEvents(level?: string) {
  const { data } = await apiClient.get<{ events: unknown[] }>('/events', {
    params: level ? { level } : undefined,
  });
  return data;
}

export async function rsvpEvent(id: string) {
  const { data } = await apiClient.post<{ rsvp: unknown }>(`/events/${id}/rsvp`);
  return data;
}
