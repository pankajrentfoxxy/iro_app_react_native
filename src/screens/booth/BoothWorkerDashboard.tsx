import {
  BoothMoodSentiment,
  fetchMyBoothDashboard,
  patchBoothMood,
  type BoothDashboardDto,
} from '@/src/api/booth.api';
import { completeTask } from '@/src/api/tasks.api';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { useAppSelector } from '@/src/store';
import { Colors } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOOD_OPTIONS: { key: BoothMoodSentiment; label: string; emoji: string }[] = [
  { key: 'SUPPORTIVE', label: 'Positive', emoji: '😊' },
  { key: 'NEUTRAL', label: 'Neutral', emoji: '😐' },
  { key: 'OPPOSITION', label: 'Tough day', emoji: '😟' },
];

function sentimentLabel(s: BoothMoodSentiment): string {
  return MOOD_OPTIONS.find((o) => o.key === s)?.label ?? s;
}

export function BoothWorkerDashboard() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const boothId = user?.boothLocationId ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BoothDashboardDto | null>(null);

  const [taskModalTaskId, setTaskModalTaskId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const load = useCallback(async () => {
    if (!boothId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
    setError(null);
    try {
      const d = await fetchMyBoothDashboard();
      setData(d);
    } catch (e) {
      setError(messageFromUnknownError(e));
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [boothId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const submitMood = async (sentiment: BoothMoodSentiment) => {
    if (!boothId) return;
    try {
      await patchBoothMood(boothId, { sentiment });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e) {
      Alert.alert('Could not save mood', messageFromUnknownError(e));
    }
  };

  const warRoomShare = async () => {
    try {
      await Share.share({
        message:
          `🔥 IRO War Room — Today's booth outreach:\n\n` +
          `"भारत बदलेगा — आइए IRO के साथ जुड़ें।"\n\n` +
          `(Shared from booth worker app — replace with district feed copy.)`,
      });
    } catch {
      /* cancelled */
    }
  };

  const openCompleteTask = (taskId: string) => {
    setProofUrl('');
    setTaskModalTaskId(taskId);
  };

  const confirmCompleteTask = async () => {
    if (!taskModalTaskId) return;
    setSubmittingTask(true);
    try {
      let gpsLat: number | null = null;
      let gpsLong: number | null = null;
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        gpsLat = pos.coords.latitude;
        gpsLong = pos.coords.longitude;
      }
      const trimmed = proofUrl.trim();
      await completeTask(taskModalTaskId, {
        gpsLat,
        gpsLong,
        proofImageUrl: trimmed.length ? trimmed : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTaskModalTaskId(null);
      await load();
    } catch (e) {
      Alert.alert('Task', messageFromUnknownError(e));
    } finally {
      setSubmittingTask(false);
    }
  };

  const whatsappReachOut = async () => {
    const msg = encodeURIComponent(
      `नमस्ते! IRO बूथ टीम से — आज का अपडेट साझा करना चाहता/चाहती हूँ। जुड़े रहें! 🔥`,
    );
    try {
      await Share.share({ message: decodeURIComponent(msg) });
    } catch {
      /* noop */
    }
  };

  if (!boothId) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>Booth dashboard</Text>
        <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No booth assigned</Text>
        <Text style={styles.emptyBody}>
          Ask your district leader to assign you to a polling booth in IRO admin. Once your profile has a booth,
          coverage, tasks, and area Reformers appear here.
        </Text>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.saffron} size="large" />
        <Text style={styles.loadingTxt}>Loading booth…</Text>
      </View>
    );
  }

  const booth = data?.booth;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>Booth dashboard</Text>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.saffron} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.err}>{error}</Text> : null}

        {booth ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTag}>YOUR BOOTH</Text>
              <Text style={styles.boothNum}>{booth.boothNumber}</Text>
              <Text style={styles.area}>{booth.area}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.metaLbl}>Registered voters</Text>
                <Text style={styles.metaVal}>{booth.registeredVoters.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.metaLbl}>Reformers in booth</Text>
                <Text style={styles.metaVal}>{booth.reformerCount}</Text>
              </View>
            </View>

            <SectionHeader title="Coverage" />
            <Text style={styles.body}>Reformers mapped to this booth vs voter roll ({booth.coveragePercent}%).</Text>
            <ProgressBar progress={Math.min(1, booth.coveragePercent / 100)} />

            <SectionHeader title="Today's booth mood" />
            <Text style={styles.body}>1-tap pulse for the district snapshot (stored on booth).</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((o) => (
                <Pressable key={o.key} style={styles.moodChip} onPress={() => void submitMood(o.key)}>
                  <Text style={styles.moodEmoji}>{o.emoji}</Text>
                  <Text style={styles.moodLbl}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
            {booth.mood ? (
              <Text style={styles.moodSaved}>
                Last: {sentimentLabel(booth.mood.sentiment)}
                {booth.mood.note ? ` — ${booth.mood.note}` : ''}
              </Text>
            ) : (
              <Text style={styles.hint}>No pulse logged yet today.</Text>
            )}

            <SectionHeader title="Daily tasks" />
            <Text style={styles.body}>Assigned to you · due today (UTC window).</Text>
            {(data?.tasksDueToday ?? []).length === 0 ? (
              <Text style={styles.hint}>No tasks due today — great job!</Text>
            ) : (
              (data?.tasksDueToday ?? []).map((t) => (
                <View key={t.id} style={styles.taskRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{t.title}</Text>
                    <Text style={styles.taskMeta}>
                      {t.priority} · {t.status.replace('_', ' ')}
                    </Text>
                  </View>
                  {t.status !== 'COMPLETED' ? (
                    <Button title="Done" variant="outline" onPress={() => openCompleteTask(t.id)} style={styles.taskBtn} />
                  ) : (
                    <Text style={styles.doneLbl}>✓</Text>
                  )}
                </View>
              ))
            )}

            <SectionHeader title="War room share" />
            <Text style={styles.body}>Daily line from HQ — share to your circles.</Text>
            <Button title="Share today's post" onPress={() => void warRoomShare()} />

            <SectionHeader title="My area Reformers" />
            <Text style={styles.body}>
              Same booth assignment · {data?.inactiveCount ?? 0} inactive (&gt;7d since profile touch).
            </Text>
            <Button title="Reach out (share intent)" variant="outline" onPress={() => void whatsappReachOut()} />

            {(data?.reformers ?? []).map((r) => (
              <View key={r.id} style={styles.personRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{r.fullName}</Text>
                  <Text style={styles.personMeta}>
                    {r.referralCode} · {r.roleName ?? r.roleLevel ?? 'Reformer'}
                  </Text>
                </View>
                {r.inactiveAlert ? (
                  <View style={styles.alertPill}>
                    <Text style={styles.alertTxt}>Inactive</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={!!taskModalTaskId} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete task</Text>
            <Text style={styles.modalHint}>Optional proof image URL (upload pipeline can replace this).</Text>
            <TextInput
              value={proofUrl}
              onChangeText={setProofUrl}
              placeholder="https://…"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setTaskModalTaskId(null)} />
              <Button title={submittingTask ? '…' : 'Submit'} onPress={() => void confirmCompleteTask()} />
            </View>
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
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  screenTitle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
  },
  loadingTxt: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    color: Colors.textSecondary,
  },
  err: {
    fontFamily: FontFamily.body,
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardTag: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 11,
    color: Colors.saffron,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  boothNum: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.white,
  },
  area: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  metaLbl: {
    fontFamily: FontFamily.body,
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  metaVal: {
    fontFamily: FontFamily.bodySemi,
    color: Colors.white,
    fontSize: FontSize.subheading,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  moodChip: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLbl: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  moodSaved: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.saffronLight,
    marginBottom: Spacing.lg,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskTitle: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.white,
  },
  taskMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  taskBtn: {
    flexShrink: 0,
    paddingHorizontal: Spacing.md,
  },
  doneLbl: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.success,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  personName: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.white,
  },
  personMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  alertPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  alertTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 10,
    color: Colors.warning,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  modalHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.white,
    fontFamily: FontFamily.body,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'flex-end',
  },
});
