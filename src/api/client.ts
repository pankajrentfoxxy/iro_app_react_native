import axios from 'axios';
import { API_BASE_URL } from '@/src/config/api.config';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { store } from '@/src/store';
import { logout } from '@/src/store/auth.slice';
import { storage } from '@/src/utils/storage';

async function clearSession() {
  await storage.clearAuth();
  store.dispatch(logout());
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getString(storage.keys.jwt);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** iro-server envelope `{ success, data }` → expose inner `data` as `response.data`. */
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      (payload as { success: unknown }).success === true &&
      'data' in payload
    ) {
      return { ...response, data: (payload as { data: unknown }).data };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const path = `${originalRequest.url ?? ''}`;
      if (path.includes('/auth/refresh')) {
        await clearSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = await storage.getString(storage.keys.refreshToken);

      if (refreshToken) {
        try {
          const r = await axios.post<{ success?: boolean; data?: { accessToken: string; refreshToken: string } }>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const body = r.data;
          const bundle =
            body && typeof body === 'object' && 'success' in body && body.success && 'data' in body && body.data
              ? body.data
              : (body as { accessToken?: string; refreshToken?: string });

          const accessToken = bundle?.accessToken;
          const newRefresh = bundle?.refreshToken;
          if (accessToken && newRefresh) {
            await storage.set(storage.keys.jwt, accessToken);
            await storage.set(storage.keys.refreshToken, newRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          await clearSession();
        }
      } else {
        await clearSession();
      }
    }

    return Promise.reject(Object.assign(error, { friendlyMessage: messageFromUnknownError(error) }));
  }
);

export default apiClient;
