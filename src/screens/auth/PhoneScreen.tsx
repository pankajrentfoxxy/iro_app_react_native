import { requestOtp } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/Button';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { nav } from '@/src/navigation/nav';
import { Colors, Gradients } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = modeParam === 'login' ? 'login' : 'register';
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneE164 = useMemo(() => {
    const clean = digits.replace(/\D/g, '').slice(0, 10);
    return clean.length === 10 ? `+91${clean}` : '';
  }, [digits]);

  const onSubmit = async () => {
    setError(null);
    if (phoneE164.length !== 13) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(phoneE164);
      nav.pushParams('/auth/otp', { phone: phoneE164, mode });
    } catch (e: unknown) {
      Alert.alert('OTP request failed', messageFromUnknownError(e));
      setError('Unable to send OTP. Check connection and try again.'+messageFromUnknownError(e));
      // setError('Unable to send OTP. Check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {mode === 'login' ? (
          <Pressable onPress={() => nav.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        {mode === 'register' ? <ProgressDots step={1} total={5} /> : null}
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.center}>
        <LinearGradient colors={[...Gradients.saffron]} style={styles.iconCircle}>
          <Ionicons name="call" size={32} color={Colors.white} />
        </LinearGradient>
        <Text style={styles.title}>What&apos;s your number?</Text>
        <Text style={styles.sub}>We&apos;ll send you a one-time password</Text>

        <View style={styles.row}>
          <View style={styles.cc}>
            <Text style={styles.ccTxt}>+91</Text>
          </View>
          <TextInput
            value={digits}
            onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="Phone No"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
        </View>
        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Button title="GET OTP" loading={loading} disabled={!phoneE164} onPress={onSubmit} style={styles.btn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: Spacing.lg,
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center',
  },
  sub: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    width: '100%',
    gap: Spacing.sm,
  },
  cc: {
    backgroundColor: Colors.navyLight,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ccTxt: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: Colors.saffron,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontFamily: FontFamily.heading,
    fontSize: 22,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  err: {
    marginTop: Spacing.sm,
    alignSelf: 'stretch',
    color: Colors.danger,
    fontSize: 13,
    fontFamily: FontFamily.body,
  },
  btn: {
    marginTop: Spacing.xxl,
    alignSelf: 'stretch',
  },
});
