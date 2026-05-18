import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Backend: iro-server — routes under `/api` on port **4000**.
 *
 * Use **`EXPO_PUBLIC_API_BASE_URL`** when you need an explicit URL (e.g. Render).
 */
function hostFromExpoPackagerUri(): string | null {
  const uri = Constants.expoConfig?.hostUri;
  if (!uri || typeof uri !== 'string') return null;
  const host = uri.split(':')[0];
  if (!host || host === 'localhost') return null;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
  return null;
}

function defaultBase(): string {
  const envUrl =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL ?
      process.env.EXPO_PUBLIC_API_BASE_URL
    : undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const dev = typeof __DEV__ !== 'undefined' && __DEV__;

  if (Platform.OS === 'web') {
    return 'http://localhost:4000/api';
  }

  if (dev) {
    const lanHost = hostFromExpoPackagerUri();
    if (lanHost) return `http://${lanHost}:4000/api`;
    if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
  }

  return 'http://localhost:4000/api';
}

export const API_BASE_URL = defaultBase();

/** Socket.io listens on same host without `/api`. */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');
