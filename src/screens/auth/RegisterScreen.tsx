import { registerUser } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { iroUserToProfile } from '@/src/lib/iroUser';
import { nav } from '@/src/navigation/nav';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { setCredentials } from '@/src/store/auth.slice';
import { Colors } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily, FontSize } from '@/src/theme/typography';
import type { RegisterWizardDraft } from '@/src/types/auth.types';
import type { UserProfile } from '@/src/types/user.types';
import { storage } from '@/src/utils/storage';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { createElement, useEffect, useMemo, useState } from 'react';
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

import {
  getBlocksForStateAndDistrict,
  getDistrictsForState,
  getIndianStates,
} from '@/src/lib/locationData';

const OCCUPATIONS = ['Student', 'Farmer', 'Business', 'Service/Job', 'Professional', 'Other'] as const;
const EDUCATION = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
  'PhD',
] as const;

type WizardStep = 0 | 1 | 2;

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Latest calendar birth date (local midnight) that is still 18+ as of today. */
function getLatestAllowedDob(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

function isAtLeast18YearsOld(birth: Date): boolean {
  const cutoff = getLatestAllowedDob();
  const b = new Date(birth);
  b.setHours(0, 0, 0, 0);
  return b.getTime() <= cutoff.getTime();
}

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((s) => s.auth.user);
  const { phone: phoneParam, ref: refParam, invite: inviteParam } = useLocalSearchParams<{
    phone?: string;
    ref?: string | string[];
    invite?: string | string[];
  }>();
  const phone = phoneParam ?? reduxUser?.phone ?? '';

  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState(reduxUser?.name ?? '');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDob, setShowDob] = useState(false);
  const [gender, setGender] = useState<'' | 'Male' | 'Female' | 'Other'>('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');

  const states = useMemo(() => getIndianStates(), []);
  const [stateName, setStateName] = useState('');

  const districts = useMemo(() => (stateName ? getDistrictsForState(stateName) : []), [stateName]);
  const [districtName, setDistrictName] = useState('');

  const blocks = useMemo(
    () => (stateName && districtName ? getBlocksForStateAndDistrict(stateName, districtName) : []),
    [districtName, stateName]
  );
  const [blockName, setBlockName] = useState('');
  const [villageName, setVillageName] = useState('');

  const [pincode, setPincode] = useState('');

  const [referralCode, setReferralCode] = useState('');
  const [picker, setPicker] = useState<
    null | 'occupation' | 'education' | 'state' | 'district' | 'block'
  >(null);
  const [pickerQuery, setPickerQuery] = useState('');
  useEffect(() => {
    setPickerQuery('');
  }, [picker]);

  useEffect(() => {
    const rawInvite = Array.isArray(inviteParam) ? inviteParam[0] : inviteParam;
    const rawRef = Array.isArray(refParam) ? refParam[0] : refParam;
    const fromInvite = rawInvite?.trim();
    const fromRef = rawRef?.trim();
    if (fromInvite) setReferralCode(fromInvite.toUpperCase());
    else if (fromRef) setReferralCode(fromRef.toUpperCase());
  }, [inviteParam, refParam]);

  const [celebrate, setCelebrate] = useState(false);
  const [loading, setLoading] = useState(false);

  const openPicker = (p: NonNullable<typeof picker>) => {
    setPicker(p);
  };

  const openDobPicker = () => {
    const latest = getLatestAllowedDob();
    let fallbackDob: Date;
    if (!dob) {
      fallbackDob = new Date(2000, 0, 1);
    } else if (isAtLeast18YearsOld(dob)) {
      fallbackDob = dob;
    } else {
      fallbackDob = latest;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fallbackDob,
        mode: 'date',
        maximumDate: latest,
        minimumDate: new Date(1920, 0, 1),
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) setDob(date);
        },
      });
      return;
    }
    if (Platform.OS === 'web') {
      return;
    }
    setShowDob(true);
  };

  const onIosDobChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDob(date);
  };

  const progressStep = step === 0 ? 3 : step === 1 ? 4 : 5;

  const personalMissing = (): string[] => {
    const m: string[] = [];
    if (!name.trim()) m.push('Full name');
    if (!dob) m.push('Date of birth');
    else if (!isAtLeast18YearsOld(dob)) m.push('You must be at least 18 years old');
    if (!gender) m.push('Gender');
    if (!occupation.trim()) m.push('Occupation');
    if (!education.trim()) m.push('Education');
    return m;
  };

  const nextFromPersonal = () => {
    const missing = personalMissing();
    if (missing.length) {
      const body = missing.length > 1 ? `• ${missing.join('\n• ')}` : missing[0];
      Alert.alert('Please complete', body);
      return;
    }
    setStep(1);
  };

  const locationMissing = (): string[] => {
    const m: string[] = [];
    if (!stateName.trim()) m.push('State / UT');
    if (stateName.trim() && districts.length === 0) m.push('No district data for selected state');
    if (!districtName.trim()) m.push('District');
    if (stateName.trim() && districtName.trim() && blocks.length === 0) {
      m.push('No block data for selected district');
    }
    if (districtName.trim() && blocks.length > 0 && !blockName.trim()) m.push('Block / Taluka');
    if (!villageName.trim()) m.push('Village or ward name');
    if (pincode.replace(/\D/g, '').length !== 6) m.push('6-digit PIN code');
    return m;
  };

  const nextFromLocation = () => {
    const missing = locationMissing();
    if (missing.length) {
      const body = missing.length > 1 ? `• ${missing.join('\n• ')}` : missing[0];
      Alert.alert('Please complete', body);
      return;
    }
    setStep(2);
  };

  const submitRegister = async () => {
    const registerTok = await storage.getString(storage.keys.registerToken);
    if (!phone.trim()) {
      Alert.alert('Registration', 'Phone number missing. Start again from login.');
      return;
    }
    if (!registerTok) {
      Alert.alert(
        'Registration',
        'Session expired. Go back and request a new OTP to continue registration.'
      );
      return;
    }

    const missPersonal = personalMissing();
    const missLocation = locationMissing();
    if (missPersonal.length || missLocation.length) {
      const parts = [...missPersonal, ...missLocation];
      Alert.alert('Please complete', parts.length > 1 ? `• ${parts.join('\n• ')}` : parts[0]);
      return;
    }
    if (!gender || !dob) {
      Alert.alert('Registration', 'Please complete all required fields.');
      return;
    }
    if (!isAtLeast18YearsOld(dob)) {
      Alert.alert('Registration', 'You must be at least 18 years old to register.');
      return;
    }

    const draft: RegisterWizardDraft = {
      fullName: name.trim(),
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

    setLoading(true);
    try {
      const referral = draft.referralCode?.trim() || null;
      const res = await registerUser({
        registerToken: registerTok,
        phone: draft.phone,
        fullName: draft.fullName,
        referralCode: referral && referral.length >= 4 ? referral : null,
        dob: draft.dob,
        gender: draft.gender,
        village: draft.village.trim(),
        pincode: draft.pincode,
        occupation: draft.occupation,
        education: draft.education,
        stateName: draft.state,
        districtName: draft.district,
        blockName: draft.block,
      });

      await storage.delete(storage.keys.registerToken);
      await storage.set(storage.keys.jwt, res.accessToken);
      await storage.set(storage.keys.refreshToken, res.refreshToken);

      const base = iroUserToProfile(res.user, draft.phone);
      const user: UserProfile = {
        ...base,
        name: draft.fullName,
        state: draft.state,
        district: draft.district,
      };
      await storage.set(storage.keys.user, JSON.stringify(user));
      dispatch(setCredentials({ token: res.accessToken, user }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrate(true);
      setTimeout(() => {
        nav.replace('/home');
      }, 2800);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Registration failed', messageFromUnknownError(e));
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
          ? 'State / UT'
          : picker === 'district'
            ? 'District'
            : picker === 'block'
              ? 'Block / Taluka'
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
              : [];

  const searchablePicker =
    picker === 'state' || picker === 'district' || picker === 'block';
  const q = pickerQuery.trim().toLowerCase();
  const pickerDataFiltered =
    searchablePicker && q.length > 0
      ? pickerData.filter((item) => item.toLowerCase().includes(q))
      : pickerData;

  const onPick = (value: string) => {
    if (picker === 'occupation') setOccupation(value);
    if (picker === 'education') setEducation(value);
    if (picker === 'state') {
      setStateName(value);
      setDistrictName('');
      setBlockName('');
    }
    if (picker === 'district') {
      setDistrictName(value);
      setBlockName('');
    }
    if (picker === 'block') setBlockName(value);
    setPicker(null);
  };

  const personalComplete = personalMissing().length === 0;
  const locationComplete = locationMissing().length === 0;

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
              <Text style={styles.label}>Date of Birth * (18+)</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateRow}>
                  {createElement('input', {
                    type: 'date',
                    value: dob ? formatDate(dob) : '',
                    max: formatDate(getLatestAllowedDob()),
                    min: formatDate(new Date(1920, 0, 1)),
                    onChange: (e: { target: { value: string } }) => {
                      const v = e.target.value;
                      if (!v) {
                        setDob(null);
                        return;
                      }
                      const [y, m, d] = v.split('-').map((x) => parseInt(x, 10));
                      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
                        const next = new Date(y, m - 1, d);
                        setDob(next);
                      }
                    },
                    style: {
                      width: '100%',
                      marginTop: 4,
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 16,
                      color: '#ffffff',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxSizing: 'border-box',
                    },
                  } as Record<string, unknown>)}
                </View>
              ) : (
                <Pressable onPress={openDobPicker} style={styles.dateRow}>
                  <Text style={[styles.dateTxt, !dob && styles.selectPlaceholder]}>
                    {dob ? formatDate(dob) : 'Select date of birth'}
                  </Text>
                </Pressable>
              )}
              {dob && !isAtLeast18YearsOld(dob) ? (
                <Text style={styles.fieldError}>You must be at least 18 years old to continue.</Text>
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
              <Text style={styles.label}>Occupation *</Text>
              <Pressable onPress={() => openPicker('occupation')} style={styles.selectRow}>
                <Text style={[styles.selectVal, !occupation && styles.selectPlaceholder]}>
                  {occupation || 'Select occupation'}
                </Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Education *</Text>
              <Pressable onPress={() => openPicker('education')} style={styles.selectRow}>
                <Text style={[styles.selectVal, !education && styles.selectPlaceholder]}>
                  {education || 'Select education'}
                </Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Button title="NEXT →" onPress={nextFromPersonal} disabled={!personalComplete} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.headerTitle}>Where are you from?</Text>
            <Text style={styles.headerSub}>Districts &amp; blocks from official block listings; village is free text.</Text>

            {districts.length === 0 && !!stateName ? (
              <Text style={styles.warn}>
                No district data for “{stateName}”. Update `INDIA_STATE_LABEL_TO_LGD_CODE` if this state should be mapped.
              </Text>
            ) : null}

            <Card style={styles.fieldCard}>
              <Pressable onPress={() => openPicker('state')} style={styles.selectRow}>
                <Text style={styles.label}>State / UT *</Text>
                <Text style={[styles.selectStrong, !stateName && styles.selectPlaceholder]}>
                  {stateName || 'Select state'}
                </Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>
            <Card style={styles.fieldCard}>
              <Pressable
                onPress={() => stateName && openPicker('district')}
                style={[styles.selectRow, !stateName && styles.selectRowMuted]}
              >
                <Text style={styles.label}>District *</Text>
                <Text
                  style={[
                    styles.selectStrong,
                    (!districtName || !stateName) && styles.selectPlaceholder,
                  ]}
                >
                  {!stateName ? 'Select state first' : districtName || 'Select district'}
                </Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>
            <Card style={styles.fieldCard}>
              <Pressable
                onPress={() => districtName && openPicker('block')}
                style={[styles.selectRow, !districtName && styles.selectRowMuted]}
              >
                <Text style={styles.label}>Block / Taluka *</Text>
                <Text
                  style={[
                    styles.selectStrong,
                    (!blockName || !districtName) && styles.selectPlaceholder,
                  ]}
                >
                  {!districtName ? 'Select district first' : blockName || 'Select block'}
                </Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </Card>

            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Village / Ward — type your place name *</Text>
              <TextInput
                value={villageName}
                onChangeText={setVillageName}
                placeholder="Type your village or ward"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
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
              disabled={!locationComplete}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.headerTitle}>Almost there!</Text>
            <Card style={styles.fieldCard}>
              <Text style={styles.label}>Invite or referral code (optional)</Text>
              <Text style={styles.hint}>
                Use a role invite (e.g. L7-ABC123) from a leader, or a legacy reformer code (IRO-…).
                Your role is assigned by the server from the code — not chosen here.
              </Text>
              <TextInput
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                placeholder="L7-XXXXXX or IRO-XXXXX"
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

      <Modal visible={showDob} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Date of birth</Text>
            <DateTimePicker
              value={
                !dob
                  ? new Date(2000, 0, 1)
                  : isAtLeast18YearsOld(dob)
                    ? dob
                    : getLatestAllowedDob()
              }
              mode="date"
              display="spinner"
              themeVariant="dark"
              onChange={onIosDobChange}
              maximumDate={getLatestAllowedDob()}
              minimumDate={new Date(1920, 0, 1)}
            />
            <Button title="Done" onPress={() => setShowDob(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={picker !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerTitle}</Text>
            {searchablePicker ? (
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Search..."
                placeholderTextColor={Colors.textMuted}
                style={styles.modalSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
            ) : null}
            <FlatList
              data={pickerDataFiltered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
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
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 17,
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
  selectPlaceholder: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
  },
  selectRowMuted: {
    opacity: 0.65,
  },
  dateHint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
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
  warn: {
    color: Colors.danger,
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  fieldError: {
    color: Colors.danger,
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  modalSearch: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.white,
    backgroundColor: Colors.navy,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
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
