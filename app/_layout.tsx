import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from '@expo-google-fonts/baloo-2';
import {
  JetBrainsMono_400Regular,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, useAppDispatch, useAppSelector } from '@/src/store';
import { logout, setCredentials } from '@/src/store/auth.slice';
import type { UserProfile } from '@/src/types/user.types';
import { Colors } from '@/src/theme/colors';
import { storage } from '@/src/utils/storage';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [authReady, setAuthReady] = useState(false);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const jwt = await storage.getString(storage.keys.jwt);
      const rawUser = await storage.getString(storage.keys.user);
      if (cancelled) return;
      if (jwt && rawUser) {
        try {
          const user = JSON.parse(rawUser) as UserProfile;
          dispatch(setCredentials({ token: jwt, user }));
        } catch {
          await storage.clearAuth();
          dispatch(logout());
        }
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!authReady || !navState?.key) return;

    const seg0 = segments[0];
    const inProtected = seg0 === '(tabs)' || seg0 === 'reformer-card';
    const inWelcome = seg0 === 'welcome';
    const inAuth = seg0 === 'auth';
    const inSplash = pathname === '/' || pathname === '/index' || seg0 === 'index';

    if (!token && inProtected) {
      router.replace('/welcome');
      return;
    }

    if (token && (inWelcome || inAuth) && !inSplash) {
      router.replace('/home');
    }
  }, [authReady, navState?.key, pathname, router, segments, token]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <AuthGate>
            <StatusBar barStyle="light-content" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.navy },
                animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="reformer-card" options={{ presentation: 'modal' }} />
            </Stack>
          </AuthGate>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
