import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { nav } from '@/src/navigation/nav';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { Button } from '@/src/components/ui/Button';

export function WelcomeScreen() {
  const glow = useSharedValue(0.35);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 1400 }), withTiming(0.35, { duration: 1400 })),
      -1,
      false
    );
  }, [glow]);

  return (
    <LinearGradient colors={[...Gradients.hero]} style={styles.root}>
      <View style={styles.top}>
        <View style={styles.emblemWrap}>
          <Animated.View style={[styles.emblemRing, ringStyle]} />
          <View style={styles.emblem}>
            <Text style={styles.emblemTxt}>🇮🇳</Text>
          </View>
        </View>
        <Text style={styles.hindi}>भारत बदलेगा</Text>
        <Text style={styles.en}>Be a Reformer. Build the movement.</Text>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={[styles.pill, styles.mt24]}>
          <Text style={styles.pillTxt}>🌐  Real-time Network</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.pill}>
          <Text style={styles.pillTxt}>📊  Data-Driven Strategy</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.pill}>
          <Text style={styles.pillTxt}>🗳️  Democratic Leadership</Text>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Button
          title="JOIN AS REFORMER"
          onPress={() => nav.pushParams('/auth/phone', { mode: 'register' })}
        />
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.9 }]}
          onPress={() => nav.pushParams('/auth/phone', { mode: 'login' })}
        >
          <Text style={styles.secondaryTxt}>I ALREADY HAVE AN ACCOUNT</Text>
        </Pressable>
        <Text style={styles.footer}>IRO • Indian Republic Org</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: Spacing.xxxl,
  },
  emblemWrap: {
    marginTop: 48,
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: Colors.saffron,
  },
  emblem: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emblemTxt: {
    fontSize: 56,
  },
  hindi: {
    marginTop: Spacing.xl,
    fontFamily: FontFamily.display,
    fontSize: 36,
    color: Colors.white,
    textAlign: 'center',
  },
  en: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  mt24: {
    marginTop: Spacing.xl,
  },
  pill: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.navyLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  pillTxt: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottom: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.transparent,
    gap: Spacing.md,
  },
  secondary: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.saffron,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  secondaryTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.saffron,
  },
  footer: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
