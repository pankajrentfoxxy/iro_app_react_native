import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { UserProfile } from '@/src/types/user.types';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import type { UpdateProfileBody } from '@/src/api/auth.api';

const GENDERS = ['Male', 'Female', 'Other'] as const;

type Props = {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSave: (body: UpdateProfileBody) => Promise<void>;
};

export function EditProfileModal({ visible, user, onClose, onSave }: Props) {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('Male');
  const [village, setVillage] = useState('');
  const [pincode, setPincode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [blockName, setBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.name ?? '');
    setDob(user.dob ?? '');
    setGender(user.gender && GENDERS.includes(user.gender as (typeof GENDERS)[number]) ? user.gender : 'Male');
    setVillage(user.village ?? '');
    setPincode(user.pincode ?? '');
    setOccupation(user.occupation ?? '');
    setEducation(user.education ?? '');
    setStateName(user.state ?? '');
    setDistrictName(user.district ?? '');
    setBlockName(user.block ?? '');
    setError(null);
  }, [visible, user]);

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
      setError('Date of birth must be YYYY-MM-DD');
      return;
    }
    const pin = pincode.replace(/\D/g, '');
    if (pin.length !== 6) {
      setError('PIN code must be 6 digits');
      return;
    }
    if (!village.trim() || !occupation.trim() || !education.trim() || !stateName.trim() || !districtName.trim() || !blockName.trim()) {
      setError('Please fill all fields');
      return;
    }

    const body: UpdateProfileBody = {
      fullName: fullName.trim(),
      dob: dob.trim(),
      gender,
      village: village.trim(),
      pincode: pin,
      occupation: occupation.trim(),
      education: education.trim(),
      stateName: stateName.trim(),
      districtName: districtName.trim(),
      blockName: blockName.trim(),
    };

    setSaving(true);
    try {
      await onSave(body);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Edit profile</Text>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          >
            <Field label="Full name" value={fullName} onChangeText={setFullName} />
            <Field label="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.chip, gender === g ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={[styles.chipTxt, gender === g && styles.chipTxtOn]}>{g}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Village / ward" value={village} onChangeText={setVillage} />
            <Field label="PIN code" value={pincode} onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
            <Field label="Occupation" value={occupation} onChangeText={setOccupation} />
            <Field label="Education" value={education} onChangeText={setEducation} />
            <Field label="State / UT" value={stateName} onChangeText={setStateName} />
            <Field label="District" value={districtName} onChangeText={setDistrictName} />
            <Field label="Block / Taluka" value={blockName} onChangeText={setBlockName} />

            {error ? <Text style={styles.err}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} style={{ flex: 1 }} />
            <Button title="Save" onPress={() => void submit()} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.navyLight,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    maxHeight: '88%',
  },
  scroll: {
    maxHeight: '72%',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  field: {
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
    backgroundColor: Colors.navy,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
  },
  chipOn: {
    backgroundColor: Colors.saffron,
  },
  chipOff: {
    backgroundColor: Colors.navyMedium,
  },
  chipTxt: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  chipTxtOn: {
    color: Colors.white,
  },
  err: {
    color: Colors.danger,
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
