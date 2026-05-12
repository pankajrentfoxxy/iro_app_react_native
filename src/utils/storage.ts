import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  jwt: 'jwt_token',
  refreshToken: 'refresh_token',
  /** Short-lived token from OTP verify when `needsRegistration` is true. */
  registerToken: 'register_token_pending',
  user: 'current_user',
} as const;

export const storage = {
  keys: KEYS,

  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.jwt, KEYS.refreshToken, KEYS.user]);
  },
};
