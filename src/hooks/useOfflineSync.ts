import { batchSyncQuestionnaires } from '@/src/api/questionnaires.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

const PENDING_KEY = 'pending_surveys';

export function useOfflineSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (!state.isConnected) return;
      const pending = await AsyncStorage.getItem(PENDING_KEY);
      if (!pending) return;
      try {
        const responses = JSON.parse(pending) as Parameters<typeof batchSyncQuestionnaires>[0];
        await batchSyncQuestionnaires(responses);
        await AsyncStorage.removeItem(PENDING_KEY);
      } catch {
        /* keep pending for next reconnect */
      }
    });
    return () => unsubscribe();
  }, []);
}
