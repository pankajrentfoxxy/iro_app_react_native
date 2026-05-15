import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAppDispatch } from '@/src/store';
import { setCredentials } from '@/src/store/auth.slice';
import { storage } from '@/src/utils/storage';
import type { UserProfile } from '@/src/types/user.types';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';

export default function TabsLayout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rawUser, token] = await Promise.all([
        storage.getString(storage.keys.user),
        storage.getString(storage.keys.jwt),
      ]);
      if (cancelled || !token || !rawUser) return;
      try {
        const user = JSON.parse(rawUser) as UserProfile;
        dispatch(setCredentials({ token, user }));
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navy,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 72 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.saffron,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: FontFamily.bodyMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarIcon: ({ color, size }) => <Ionicons name="git-network-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="booth"
        options={{
          title: 'Booth',
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
