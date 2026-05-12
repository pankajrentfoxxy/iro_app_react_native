import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

export type SurveyKind = 'PULSE' | 'BOOTH' | 'CANDIDATE' | 'ISSUE' | 'OPPOSITION';

const SURVEY_OPTIONS: { id: SurveyKind; label: string; hint: string }[] = [
  { id: 'PULSE', label: 'Pulse', hint: 'Daily mood (1–5)' },
  { id: 'BOOTH', label: 'Booth', hint: 'Booth intelligence' },
  { id: 'CANDIDATE', label: 'Candidate', hint: 'Rating + feedback' },
  { id: 'ISSUE', label: 'Issue', hint: 'Type, photo, GPS' },
  { id: 'OPPOSITION', label: 'Opposition', hint: 'Intel' },
];

const ISSUE_TYPES = [
  'Infrastructure',
  'Water & sanitation',
  'Power',
  'Roads',
  'Healthcare',
  'Education',
  'Law & order',
  'Other',
] as const;

type GpsCoords = { latitude: number; longitude: number };

export interface SurveyFormModalProps {
  visible: boolean;
  onClose: () => void;
}

function RatingRow({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.ratingChip, value === n && styles.ratingChipActive]}
          >
            <Text style={[styles.ratingChipTxt, value === n && styles.ratingChipTxtActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SurveyFormModal({ visible, onClose }: SurveyFormModalProps) {
  const insets = useSafeAreaInsets();

  const [surveyKind, setSurveyKind] = useState<SurveyKind>('PULSE');
  const [pulseSentiment, setPulseSentiment] = useState<number | null>(null);
  const [boothDominant, setBoothDominant] = useState('');
  const [boothOpposition, setBoothOpposition] = useState('');
  const [boothGaps, setBoothGaps] = useState('');
  const [candidateRating, setCandidateRating] = useState<number | null>(null);
  const [candidateFeedback, setCandidateFeedback] = useState('');
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0]);
  const [issuePhotoUri, setIssuePhotoUri] = useState<string | null>(null);
  const [issueGps, setIssueGps] = useState<GpsCoords | null>(null);
  const [oppActivities, setOppActivities] = useState('');
  const [oppMessaging, setOppMessaging] = useState('');
  const [oppNewFaces, setOppNewFaces] = useState('');

  const reset = useCallback(() => {
    setSurveyKind('PULSE');
    setPulseSentiment(null);
    setBoothDominant('');
    setBoothOpposition('');
    setBoothGaps('');
    setCandidateRating(null);
    setCandidateFeedback('');
    setIssueType(ISSUE_TYPES[0]);
    setIssuePhotoUri(null);
    setIssueGps(null);
    setOppActivities('');
    setOppMessaging('');
    setOppNewFaces('');
  }, []);

  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  const payload = useMemo(() => {
    const base = { surveyType: surveyKind, gpsTagged: surveyKind === 'ISSUE' && !!issueGps };
    switch (surveyKind) {
      case 'PULSE':
        return { ...base, sentiment: pulseSentiment };
      case 'BOOTH':
        return {
          ...base,
          dominantIssues: boothDominant,
          oppositionActivity: boothOpposition,
          coverageGaps: boothGaps,
        };
      case 'CANDIDATE':
        return { ...base, candidateRating, feedback: candidateFeedback };
      case 'ISSUE':
        return {
          ...base,
          issueType,
          photoUri: issuePhotoUri,
          location: issueGps,
        };
      case 'OPPOSITION':
        return {
          ...base,
          oppositionActivities: oppActivities,
          messaging: oppMessaging,
          newFacesSeen: oppNewFaces,
        };
      default:
        return base;
    }
  }, [
    surveyKind,
    pulseSentiment,
    boothDominant,
    boothOpposition,
    boothGaps,
    candidateRating,
    candidateFeedback,
    issueType,
    issuePhotoUri,
    issueGps,
    oppActivities,
    oppMessaging,
    oppNewFaces,
  ]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setIssuePhotoUri(result.assets[0].uri);
  };

  const captureGps = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const pos = await Location.getCurrentPositionAsync({});
    setIssueGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
  };

  const handleSubmit = () => {
    console.log('[Survey submit]', {
      ...payload,
      submittedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={[styles.header, { paddingTop: Spacing.md + insets.top }]}>
          <Text style={styles.title}>Field survey</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Survey type</Text>
          <View style={styles.typeGrid}>
            {SURVEY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSurveyKind(opt.id)}
                style={[styles.typeCard, surveyKind === opt.id && styles.typeCardActive]}
              >
                <Text style={[styles.typeLabel, surveyKind === opt.id && styles.typeLabelActive]}>{opt.label}</Text>
                <Text style={styles.typeHint}>{opt.hint}</Text>
              </Pressable>
            ))}
          </View>

          {surveyKind === 'PULSE' && (
            <RatingRow value={pulseSentiment} onChange={setPulseSentiment} label="How is the mood in your area today? (1–5)" />
          )}

          {surveyKind === 'BOOTH' && (
            <>
              <Field
                label="Dominant issues"
                value={boothDominant}
                onChangeText={setBoothDominant}
                placeholder="What voters are talking about"
              />
              <Field
                label="Opposition activity"
                value={boothOpposition}
                onChangeText={setBoothOpposition}
                placeholder="Notable opposition moves"
              />
              <Field
                label="Coverage gaps"
                value={boothGaps}
                onChangeText={setBoothGaps}
                placeholder="Areas we are weak or missing"
              />
            </>
          )}

          {surveyKind === 'CANDIDATE' && (
            <>
              <RatingRow value={candidateRating} onChange={setCandidateRating} label="Candidate rating (1–5)" />
              <Field
                label="Feedback"
                value={candidateFeedback}
                onChangeText={setCandidateFeedback}
                placeholder="Short notes on the candidate"
                multiline
              />
            </>
          )}

          {surveyKind === 'ISSUE' && (
            <>
              <Text style={styles.fieldLabel}>Issue type</Text>
              <View style={styles.chipWrap}>
                {ISSUE_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setIssueType(t)}
                    style={[styles.chip, issueType === t && styles.chipActive]}
                  >
                    <Text style={[styles.chipTxt, issueType === t && styles.chipTxtActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.rowBtns}>
                <Pressable style={styles.secondaryBtn} onPress={pickPhoto}>
                  <Text style={styles.secondaryBtnTxt}>{issuePhotoUri ? 'Change photo' : 'Add photo'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={captureGps}>
                  <Text style={styles.secondaryBtnTxt}>{issueGps ? 'Refresh GPS' : 'Capture GPS'}</Text>
                </Pressable>
              </View>
              {issuePhotoUri ? (
                <Image source={{ uri: issuePhotoUri }} style={styles.preview} contentFit="cover" />
              ) : null}
              {issueGps ? (
                <Text style={styles.gpsMeta}>
                  GPS: {issueGps.latitude.toFixed(5)}, {issueGps.longitude.toFixed(5)}
                </Text>
              ) : null}
            </>
          )}

          {surveyKind === 'OPPOSITION' && (
            <>
              <Field
                label="Opposition activities"
                value={oppActivities}
                onChangeText={setOppActivities}
                placeholder="What they did on the ground"
              />
              <Field label="Messaging" value={oppMessaging} onChangeText={setOppMessaging} placeholder="Narratives / slogans heard" />
              <Field
                label="New faces seen"
                value={oppNewFaces}
                onChangeText={setOppNewFaces}
                placeholder="Unfamiliar people or teams"
              />
            </>
          )}

          <Button title="Submit" onPress={handleSubmit} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.navy,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.heading,
    color: Colors.white,
  },
  closeBtn: { padding: Spacing.xs },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.navy,
  },
  sectionTitle: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  typeGrid: { gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.navyLight,
    padding: Spacing.md,
  },
  typeCardActive: {
    borderColor: Colors.saffron,
    backgroundColor: '#2D1F14',
  },
  typeLabel: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
  },
  typeLabelActive: { color: Colors.saffron },
  typeHint: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  field: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.navyLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  inputMulti: { minHeight: 100 },
  ratingRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  ratingChip: {
    minWidth: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
  },
  ratingChipActive: {
    borderColor: Colors.saffron,
    backgroundColor: '#2D1F14',
  },
  ratingChipTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
  },
  ratingChipTxtActive: { color: Colors.saffron },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.navyLight,
  },
  chipActive: { borderColor: Colors.saffron, backgroundColor: '#2D1F14' },
  chipTxt: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary },
  chipTxtActive: { color: Colors.saffron, fontFamily: FontFamily.bodySemi },
  rowBtns: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  secondaryBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.saffron,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryBtnTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.caption,
    color: Colors.saffron,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.navyLight,
  },
  gpsMeta: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  submit: { marginTop: Spacing.md },
});
