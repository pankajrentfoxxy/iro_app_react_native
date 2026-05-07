/**
 * Dummy local API: `npm run api:dummy` (port 4000).
 *
 * Physical phone on same WiFi: create `.env` in project root:
 *   EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_LAN_IP:4000/api
 *   (find IP: `ipconfig` on Windows, en0 on Mac)
 *
 * Android emulator (host machine): `http://10.0.2.2:4000/api`
 */
const raw =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  'http://192.168.1.9:4000/api';

export const API_BASE_URL = raw.replace(/\/$/, '');
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');
