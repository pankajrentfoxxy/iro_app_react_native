import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { nav } from '@/src/navigation/nav';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { fetchMe } from '@/src/api/auth.api';
import { storage } from '@/src/utils/storage';

const MIN_MS = 2500;

export function SplashScreen() {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const ring = useSharedValue(0.3);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
  }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 600 });
    ring.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 900 }), withTiming(0.3, { duration: 900 })),
      -1,
      false
    );
  }, [opacity, ring, scale]);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const goWelcome = () => {
      if (cancelled) return;
      nav.replace('/welcome');
    };

    const goMain = () => {
      if (cancelled) return;
      nav.replace('/home');
    };

    (async () => {
      const token = await storage.getString(storage.keys.jwt);
      if (!token) {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_MS - elapsed);
        setTimeout(goWelcome, wait);
        return;
      }

      try {
        await fetchMe();
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_MS - elapsed);
        setTimeout(goMain, wait);
      } catch {
        await storage.clearAuth();
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_MS - elapsed);
        setTimeout(goWelcome, wait);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={logoStyle}>
        <View style={styles.flame}>
          <Text style={styles.flameIcon}>🔥</Text>
        </View>
      </Animated.View>
      <Text style={styles.brand}>IRO</Text>
      <Text style={styles.sub}>INDIAN REPUBLIC ORG</Text>
      <View style={styles.line} />
      <Text style={styles.tag}>Join. Refer. Lead. Reform.</Text>
      <Text style={styles.ver}>v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.saffron,
  },
  flame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.saffron,
  },
  flameIcon: {
    fontSize: 36,
  },
  brand: {
    marginTop: Spacing.xl,
    fontFamily: FontFamily.display,
    fontSize: 48,
    color: Colors.saffron,
    letterSpacing: 8,
  },
  sub: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 4,
  },
  line: {
    marginTop: Spacing.md,
    width: 40,
    height: 1.5,
    backgroundColor: Colors.saffron,
  },
  tag: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textMuted,
  },
  ver: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
});
