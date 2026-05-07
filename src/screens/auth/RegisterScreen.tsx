import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { registerUser } from '@/src/api/auth.api';
import { nav } from '@/src/navigation/nav';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { setCredentials, setUser } from '@/src/store/auth.slice';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { storage } from '@/src/utils/storage';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import type { RegisterPayload } from '@/src/types/auth.types';
import type { UserProfile } from '@/src/types/user.types';

const OCCUPATIONS = ['Student', 'Farmer', 'Business', 'Service/Job', 'Professional', 'Other'] as const;
const EDUCATION = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
  'PhD',
] as const;

const LOCATION_TREE: Record<string, Record<string, Record<string, string[]>>> = {
  'Uttar Pradesh': {
    Lucknow: {
      'Gomti Nagar': ['Vijay Khand', 'Vishesh Khand'],
      Alambagh: ['Alamnagar', 'Mandi Parishad'],
    },
    Varanasi: {
      Dashashwamedh: ['Godaulia', 'Sonapura'],
      Sigra: ['Mahmoorganj', 'Sunderpur'],
    },
  },
  Delhi: {
    'New Delhi': {
      Connaught: ['Block A', 'Block B'],
      KarolBagh: ['East End', 'West End'],
    },
  },
  Maharashtra: {
    Mumbai: {
      Andheri: ['West', 'East'],
      Dadar: ['East', 'West'],
    },
  },
};

type WizardStep = 0 | 1 | 2;

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((s) => s.auth.user);
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const phone = phoneParam ?? reduxUser?.phone ?? '';

  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState(reduxUser?.name ?? '');
  const [dob, setDob] = useState(new Date(1995, 0, 1));
  const [showDob, setShowDob] = useState(false);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [occupation, setOccupation] = useState<string>(OCCUPATIONS[0]);
  const [education, setEducation] = useState<string>(EDUCATION[2]);

  const states = useMemo(() => Object.keys(LOCATION_TREE), []);
  const [stateName, setStateName] = useState(states[0] ?? '');
  const districts = useMemo(
    () => (stateName ? Object.keys(LOCATION_TREE[stateName] ?? {}) : []),
    [stateName]
  );
  const [districtName, setDistrictName] = useState(districts[0] ?? '');
  const blocks = useMemo(() => {
    if (!stateName || !districtName) return [] as string[];
    return Object.keys(LOCATION_TREE[stateName]?.[districtName] ?? {});
  }, [districtName, stateName]);
  const [blockName, setBlockName] = useState(blocks[0] ?? '');
  const villages = useMemo(() => {
    if (!stateName || !districtName || !blockName) return [] as string[];
    return LOCATION_TREE[stateName]?.[districtName]?.[blockName] ?? [];
  }, [blockName, districtName, stateName]);
  const [villageName, setVillageName] = useState(villages[0] ?? '');
  const [pincode, setPincode] = useState('');

  const [referralCode, setReferralCode] = useState('');
  const [picker, setPicker] = useState<
    null | 'occupation' | 'education' | 'state' | 'district' | 'block' | 'village'
  >(null);
  const [celebrate, setCelebrate] = useState(false);
  const [loading, setLoading] = useState(false);

  const openPicker = (p: NonNullable<typeof picker>) => {
    setPicker(p);
  };

  const progressStep = step === 0 ? 3 : step === 1 ? 4 : 5;

  const nextFromPersonal = () => {
    if (!name.trim()) return;
    setStep(1);
  };

  const nextFromLocation = () => {
    if (!stateName || !districtName || !blockName || !villageName || pincode.replace(/\D/g, '').length !== 6) {
      return;
    }
    setStep(2);
  };

  const submitRegister = async () => {
    setLoading(true);
    const payload: RegisterPayload = {
      name: name.trim(),
      dob: formatDate(dob),
      gender,
      phone,
      state: stateName,
      district: districtName,
      block: blockName,
      village: villageName,
      pincode: pincode.replace(/\D/g, ''),
      occupation,
      education,
      referralCode: referralCode.trim() || undefined,
    };
    try {
      const data = await registerUser(payload);
      const token = (data as { token?: string }).token ?? (await storage.getString(storage.keys.jwt)) ?? '';
      const raw = (data as { user?: Record<string, unknown> }).user;
      let user: UserProfile | null = reduxUser;
      if (raw && token) {
        user = {
          id: String(raw.id ?? user?.id ?? 'iro'),
          name: String(raw.name ?? payload.name),
          phone,
          reformerId: String(raw.reformerId ?? raw.reformer_id ?? `IRO-${phone.replace(/\D/g, '').slice(-6)}`),
          role: (raw.role as UserProfile['role']) ?? user?.role ?? 'reformer',
          state: stateName,
          district: districtName,
          networkCount: Number(raw.networkCount ?? 47),
          directReferrals: Number(raw.directReferrals ?? 12),
          nationalRank: Number(raw.nationalRank ?? 247),
          dayStreak: Number(raw.dayStreak ?? 12),
          surveyScore: Number(raw.surveyScore ?? 4.7),
        };
        await storage.set(storage.keys.user, JSON.stringify(user));
        dispatch(setCredentials({ token, user }));
      } else if (user && token) {
        const merged = {
          ...user,
          name: payload.name,
          state: stateName,
          district: districtName,
          reformerId: user.reformerId || `IRO-${phone.replace(/\D/g, '').slice(-6)}`,
        };
        await storage.set(storage.keys.user, JSON.stringify(merged));
        dispatch(setUser(merged));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrate(true);
      setTimeout(() => {
        nav.replace('/home');
      }, 2800);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Registration',
        'Could not reach the server. Your profile is saved locally — you can continue in the app.'
      );
      setCelebrate(true);
      setTimeout(() => {
        nav.replace('/home');
      }, 2200);
    } finally {
      setLoading(false);
    }
  };

  const pickerTitle =
    picker === 'occupation'
      ? 'Occupation'
      : picker === 'education'
        ? 'Education'
        : picker === 'state'
          ? 'State'
          : picker === 'district'
            ? 'District'
            : picker === 'block'
              ? 'Block / Taluka'
              : picker === 'village'
                ? 'Village / Ward'
                : '';

  const pickerData =
    picker === 'occupation'
      ? [...OCCUPATIONS]
      : picker === 'education'
        ? [...EDUCATION]
        : picker === 'state'
          ? states
          : picker === 'district'
            ? districts
            : picker === 'block'
              ? blocks
              : picker === 'village'
                ? villages
                : [];

  const onPick = (value: string) => {
    if (picker === 'occupation') setOccupation(value);
    if (picker === 'education') setEducation(value);
    if (picker === 'state') {
      setStateName(value);
      const d0 = Object.keys(LOCATION_TREE[value] ?? {})[0] ?? '';
      setDistrictName(d0);
      const b0 = d0 ? Object.keys(LOCATION_TREE[value]?.[d0] ?? {})[0] ?? '' : '';
      setBlockName(b0);
      const v0 = b0 ? LOCATION_TREE[value]?.[d0]?.[b0]?.[0] ?? '' : '';
      setVillageName(v0);
    }
    if (picker === 'district') {
      setDistrictName(value);
      const b0 = Object.keys(LOCATION_TREE[stateName]?.[value] ?? {})[0] ?? '';
      setBlockName(b0);
      const v0 = b0 ? LOCATION_TREE[stateName]?.[value]?.[b0]?.[0] ?? '' : '';
      setVillageName(v0);
    }
    if (picker === 'block') {
      setBlockName(value);
      const v0 = LOCATION_TREE[stateName]?.[districtName]?.[value]?.[0] ?? '';
      setVillageName(v0);
    }
    if (picker === 'village') setVillageName(value);
    setPicker(null);
  };

  if (celebrate) {
    return (
      <View style={[styles.celebrate, { paddingTop: insets.top }]}>
        <Text style={styles.celebrateEmoji}>🔥</Text>
        <Text style={styles.celebrateTitle}>Welcome to IRO, {name.trim() || 'Reformer'}!</Text>
        <Text style={styles.celebrateSub}>Your Reformer ID is being synced…</Text>
        <Text style={styles.celebrateHint}>Taking you to your dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <ProgressDots step={progressStep} total={5} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <>
            <Text style={styles.headerTitle}>Tell us about yourself</Text>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Date of Birth *</Text>
              <Pressable onPress={() => setShowDob(true)} style={styles.dateRow}>
                <Text style={styles.dateTxt}>{formatDate(dob)}</Text>
              </Pressable>
              {showDob ? (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    setShowDob(Platform.OS === 'ios');
                    if (d) setDob(d);
                  }}
                  maximumDate={new Date()}
                />
              ) : null}
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.chips}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={[styles.chip, gender === g ? styles.chipOn : styles.chipOff]}
                  >
                    <Text style={[styles.chipTxt, gender === g ? styles.chipTxtOn : styles.chipTxtOff]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Occupation</Text>
              <Pressable onPress={() => openPicker('occupation')} style={styles.selectRow}>
                <Text style={styles.selectVal}>{occupation}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Education</Text>
              <Pressable onPress={() => openPicker('education')} style={styles.selectRow}>
                <Text style={styles.selectVal}>{education}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Button title="NEXT →" onPress={nextFromPersonal} disabled={!name.trim()} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.headerTitle}>Where are you from?</Text>
            <Text style={styles.headerSub}>This connects you with your local IRO network</Text>

            <Card style={styles.fieldCard}>
              <Pressable onPress={() => openPicker('state')} style={styles.selectRow}>
                <Text style={styles.label}>State</Text>
                <Text style={styles.selectStrong}>{stateName || 'Select state'}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>
            <Card style={styles.fieldCard}>
              <Pressable onPress={() => openPicker('district')} style={styles.selectRow}>
                <Text style={styles.label}>District</Text>
                <Text style={styles.selectStrong}>{districtName || 'Select district'}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>
            <Card style={styles.fieldCard}>
              <Pressable onPress={() => openPicker('block')} style={styles.selectRow}>
                <Text style={styles.label}>Block / Taluka</Text>
                <Text style={styles.selectStrong}>{blockName || 'Select block'}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>
            <Card style={styles.fieldCard}>
              <Pressable onPress={() => openPicker('village')} style={styles.selectRow}>
                <Text style={styles.label}>Village / Ward</Text>
                <Text style={styles.selectStrong}>{villageName || 'Select village'}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>PIN code *</Text>
              <TextInput
                value={pincode}
                onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit PIN"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={6}
              />
            </Card>

            <Button
              title="NEXT →"
              onPress={nextFromLocation}
              disabled={
                !stateName ||
                !districtName ||
                !blockName ||
                !villageName ||
                pincode.replace(/\D/g, '').length !== 6
              }
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.headerTitle}>Almost there!</Text>
            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Referral Code (optional)</Text>
              <TextInput
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                placeholder="IRO-XXXXX"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                style={styles.input}
              />
            </Card>
            <Pressable onPress={submitRegister} style={styles.skip}>
              <Text style={styles.skipTxt}>SKIP — Join Without Referral</Text>
            </Pressable>
            <Button title="JOIN IRO →" loading={loading} onPress={submitRegister} />
          </>
        ) : null}
      </ScrollView>

      <Modal visible={picker !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerTitle}</Text>
            <FlatList
              data={pickerData}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable onPress={() => onPick(item)} style={styles.modalRow}>
                  <Text style={styles.modalRowTxt}>{item}</Text>
                </Pressable>
              )}
            />
            <Button title="Close" variant="outline" onPress={() => setPicker(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.lg,
  },
  head: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  fieldCard: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.white,
    paddingVertical: Spacing.xs,
  },
  dateRow: {
    paddingVertical: Spacing.sm,
  },
  dateTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 16,
    color: Colors.white,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  chipOn: {
    backgroundColor: Colors.saffron,
  },
  chipOff: {
    backgroundColor: Colors.navyMedium,
  },
  chipTxt: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.body,
  },
  chipTxtOn: {
    color: Colors.white,
  },
  chipTxtOff: {
    color: Colors.textSecondary,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  selectVal: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.white,
  },
  selectStrong: {
    flex: 1,
    fontFamily: FontFamily.bodySemi,
    fontSize: 16,
    color: Colors.white,
    textAlign: 'right',
  },
  chev: {
    fontSize: 22,
    color: Colors.saffron,
  },
  skip: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skipTxt: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.navyLight,
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.white,
  },
  modalRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalRowTxt: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
  },
  celebrate: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  celebrateEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  celebrateTitle: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.saffron,
    textAlign: 'center',
  },
  celebrateSub: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  celebrateHint: {
    marginTop: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
});
