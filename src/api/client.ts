import axios from 'axios';
import { API_BASE_URL } from '@/src/config/api.config';
import { storage } from '@/src/utils/storage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getString(storage.keys.jwt);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
