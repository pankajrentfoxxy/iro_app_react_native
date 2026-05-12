import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { requestOtp, verifyOtp } from '@/src/api/auth.api';
import { nav } from '@/src/navigation/nav';
import { setCredentials, logout } from '@/src/store/auth.slice';
import { useAppDispatch } from '@/src/store';
import { iroUserToProfile } from '@/src/lib/iroUser';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { storage } from '@/src/utils/storage';
import { Button } from '@/src/components/ui/Button';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  const last10 = d.slice(-10);
  if (last10.length !== 10) return phone;
  return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
}

export function OTPScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { phone, mode: modeParam } = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const mode = modeParam === 'login' ? 'login' : 'register';
  const phoneStr = phone ?? '';

  const [seconds, setSeconds] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const persistSession = useCallback(
    async (accessToken: string, refreshToken: string, apiUser: Parameters<typeof iroUserToProfile>[0]) => {
      await storage.delete(storage.keys.registerToken);
      await storage.set(storage.keys.jwt, accessToken);
      await storage.set(storage.keys.refreshToken, refreshToken);
      const user = iroUserToProfile(apiUser, phoneStr);
      await storage.set(storage.keys.user, JSON.stringify(user));
      dispatch(setCredentials({ token: accessToken, user }));
      nav.replace('/home');
    },
    [dispatch, phoneStr]
  );

  const verify = useCallback(
    async (code: string) => {
      if (code.length !== 6 || !phoneStr) return;
      setSubmitting(true);
      try {
        const data = await verifyOtp(phoneStr, code);
        if (data.needsRegistration) {
          await storage.set(storage.keys.registerToken, data.registerToken);
          await storage.delete(storage.keys.jwt);
          await storage.delete(storage.keys.refreshToken);
          dispatch(logout());
          nav.replaceParams('/auth/register', { phone: phoneStr });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }
        const { accessToken, refreshToken, user } = data;
        await persistSession(accessToken, refreshToken, user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('OTP failed', messageFromUnknownError(e));
      } finally {
        setSubmitting(false);
      }
    },
    [persistSession, phoneStr]
  );

  const onResend = useCallback(async () => {
    if (!phoneStr) return;
    setSeconds(45);
    try {
      await requestOtp(phoneStr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Could not resend OTP', messageFromUnknownError(e));
    }
  }, [phoneStr]);

  const lastAuto = useRef('');
  useEffect(() => {
    if (otp.length === 6 && otp !== lastAuto.current) {
      lastAuto.current = otp;
      void verify(otp);
    }
  }, [otp, verify]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        {mode === 'register' ? <ProgressDots step={2} total={5} /> : <View style={{ width: 24 }} />}
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.center}>
        <Ionicons name="mail-outline" size={64} color={Colors.saffron} />
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.sub}>Sent to {maskPhone(phoneStr)}</Text>

        <View style={styles.otpWrap}>
          <OtpInput
            numberOfDigits={6}
            focusColor={Colors.saffron}
            onTextChange={setOtp}
            onFilled={(text) => {
              void verify(text);
            }}
            theme={{
              containerStyle: styles.otpRow,
              pinCodeContainerStyle: styles.pinBox,
              focusedPinCodeContainerStyle: styles.pinBoxFocus,
              pinCodeTextStyle: styles.pinText,
            }}
            type="numeric"
          />
        </View>

        <Text style={styles.count}>
          {seconds > 0 ? (
            <>
              Resend in 0:{seconds.toString().padStart(2, '0')}
            </>
          ) : (
            <Text onPress={() => void onResend()} style={styles.resend}>
              Resend OTP
            </Text>
          )}
        </Text>

        <Button
          title="VERIFY OTP"
          loading={submitting}
          disabled={otp.length !== 6}
          onPress={() => verify(otp)}
          style={styles.btn}
        />
      </View>
    </View>
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
  title: {
    marginTop: Spacing.lg,
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.white,
  },
  sub: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  otpWrap: {
    marginTop: Spacing.xxxl,
    width: '100%',
  },
  otpRow: {
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  pinBox: {
    width: 48,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.navyLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pinBoxFocus: {
    borderColor: Colors.saffron,
    shadowColor: Colors.saffron,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  pinText: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
  },
  count: {
    marginTop: Spacing.xl,
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resend: {
    color: Colors.saffron,
    fontFamily: FontFamily.bodySemi,
  },
  btn: {
    marginTop: Spacing.xxxl,
    alignSelf: 'stretch',
  },
});
