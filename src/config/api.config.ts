/**
 * Backend: iro-server Express API — HTTP JSON routes under **`/api`** (`http://host:4000/api`).
 *
 * Prefer **`EXPO_PUBLIC_API_BASE_URL`** in `.env` when you need an explicit URL.
 *
 * In **`__DEV__`**, Expo usually sets **`Constants.expoConfig.hostUri`** (for example `192.168.1.10:8081`).
 * The host portion is reused for REST on port **4000**, so Expo Go / dev clients on the **same LAN**
 * reach your PC automatically when Metro already does.
 *
 * Fallbacks:
 * - **Android emulator**: `http://10.0.2.2:4000/api` when no LAN host is detected.
 * - **iOS Simulator / Web**: `http://localhost:4000/api`.
 *
 * Bind the Node server on **0.0.0.0** and allow **TCP 4000** through the OS firewall for LAN devices.
 */
// import Constants from 'expo-constants';

// function hostFromExpoPackagerUri(): string | null {
//   const uri =
//     Constants.expoConfig?.hostUri ??
//     (
//       Constants.manifest &&
//       typeof Constants.manifest === 'object' &&
//       'debuggerHost' in Constants.manifest &&
//       typeof (Constants.manifest as { debuggerHost?: unknown }).debuggerHost === 'string'
//         ? (Constants.manifest as { debuggerHost: string }).debuggerHost
//         : undefined
//     );
//   if (!uri || typeof uri !== 'string') return null;
//   const host = uri.split(':')[0];
//   if (!host || host === 'localhost') return null;
//   if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
//   return null;
// }

// function defaultBase(): string {
//   if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) {
//     return process.env.EXPO_PUBLIC_API_BASE_URL;
//   }

//   const dev = typeof __DEV__ !== 'undefined' && __DEV__;

//   if (Platform.OS === 'web') {
//     return 'http://localhost:4000/api';
//   }

//   if (dev) {
//     const lanHost = hostFromExpoPackagerUri();
//     if (lanHost) return `http://${lanHost}:4000/api`;
//     if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
//   }

//   return 'http://localhost:4000/api';
// }
export const API_BASE_URL = "https://iro-server-latest-1.onrender.com/api";

// export const API_BASE_URL = defaultBase().replace(/\/$/, '');
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');
