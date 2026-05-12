import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMe, updateProfile } from '@/src/api/auth.api';
import { EditProfileModal } from '@/src/components/profile/EditProfileModal';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { iroUserToProfile } from '@/src/lib/iroUser';
import { nav } from '@/src/navigation/nav';
import { store, useAppDispatch, useAppSelector } from '@/src/store';
import { logout, setUser } from '@/src/store/auth.slice';
import type { UserProfile } from '@/src/types/user.types';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { storage } from '@/src/utils/storage';

async function resolveSessionPhone(): Promise<string> {
  let phone = store.getState().auth.user?.phone ?? '';
  if (!phone) {
    const raw = await storage.getString(storage.keys.user);
    if (raw) {
      try {
        phone = (JSON.parse(raw) as UserProfile).phone ?? '';
      } catch {
        /* ignore */
      }
    }
  }
  return phone.trim();
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'I';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[1][0]}`.toUpperCase();
}

function dash(s: string | null | undefined) {
  const t = (s ?? '').trim();
  return t.length ? t : '—';
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [editOpen, setEditOpen] = useState(false);

  const pullLatestProfile = useCallback(async () => {
    const phone = await resolveSessionPhone();
    if (!phone) return;
    try {
      const apiUser = await fetchMe();
      const next = iroUserToProfile(apiUser, phone);
      await storage.set(storage.keys.user, JSON.stringify(next));
      dispatch(setUser(next));
    } catch {
      /* 401 → client clears session; network errors: keep cached user */
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void pullLatestProfile();
    }, [pullLatestProfile])
  );

  const name = user?.name ?? 'Reformer';
  const id = user?.reformerId ?? '—';
  const scoreRaw = Number(user?.nationalRank ?? 0);
  const scoreDisplay = Math.round(scoreRaw * 100) / 100;
  const scoreBar = Math.min(1, Math.max(0, scoreRaw / 100));

  const badges = useMemo(
    () =>
      [
        { emoji: '🌱', label: 'Joined', earned: true },
        { emoji: '✅', label: 'First Task', earned: (user?.tasksCompleted ?? 0) > 0 },
        { emoji: '📋', label: 'First Survey', earned: (user?.surveysSubmitted ?? 0) > 0 },
        { emoji: '🎪', label: 'First Event', earned: false },
      ] as const,
    [user?.surveysSubmitted, user?.tasksCompleted]
  );

  const onLogout = async () => {
    await storage.clearAuth();
    dispatch(logout());
    nav.replace('/welcome');
  };

  const onSaveProfile = async (body: Parameters<typeof updateProfile>[0]) => {
    const phone = await resolveSessionPhone();
    if (!phone) throw new Error('Missing phone in session');
    try {
      const apiUser = await updateProfile(body);
      const next = iroUserToProfile(apiUser, phone);
      await storage.set(storage.keys.user, JSON.stringify(next));
      dispatch(setUser(next));
    } catch (e) {
      throw new Error(messageFromUnknownError(e));
    }
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[...Gradients.hero]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            onPress={() => setEditOpen(true)}
            hitSlop={12}
            accessibilityLabel="Edit profile"
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={26} color={Colors.white} />
          </Pressable>
        </View>
        <View style={styles.headerInner}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials(name)}</Text>
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.refId}>{id}</Text>
          <Text style={styles.role}>
            {user?.role?.replace('_', ' ').toUpperCase() ?? 'REFORMER'} • {user?.state ?? 'India'}
          </Text>
          {user?.status ? (
            <Text style={styles.statusTxt}>Status: {user.status}</Text>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.directReferrals ?? 0}</Text>
          <Text style={styles.statLbl}>Referrals</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.networkCount ?? 0}</Text>
          <Text style={styles.statLbl}>Network</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.tasksCompleted ?? 0}</Text>
          <Text style={styles.statLbl}>Tasks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.surveysSubmitted ?? 0}</Text>
          <Text style={styles.statLbl}>Surveys</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Your details</Text>
        <DetailRow label="Phone" value={dash(user?.phone)} />
        <DetailRow label="Email" value={dash(user?.email ?? undefined)} />
        <DetailRow label="Date of birth" value={dash(user?.dob ?? undefined)} />
        <DetailRow label="Gender" value={dash(user?.gender ?? undefined)} />
        <DetailRow label="Village / ward" value={dash(user?.village ?? undefined)} />
        <DetailRow label="PIN code" value={dash(user?.pincode ?? undefined)} />
        <DetailRow label="Occupation" value={dash(user?.occupation ?? undefined)} />
        <DetailRow label="Education" value={dash(user?.education ?? undefined)} />
        <DetailRow label="State" value={dash(user?.state ?? undefined)} />
        <DetailRow label="District" value={dash(user?.district ?? undefined)} />
        <DetailRow label="Block" value={dash(user?.block ?? undefined)} />
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Leadership score</Text>
        <Text style={styles.scoreVal}>{scoreDisplay}</Text>
        <ProgressBar progress={scoreBar} />
        <Text style={styles.scoreHint}>Peer rating: {Number(user?.surveyScore ?? 0).toFixed(2)} • Active days: {user?.dayStreak ?? 0}</Text>
      </View>

      <View style={styles.badgesCard}>
        <Text style={styles.badgesTitle}>My badges</Text>
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View key={b.label} style={styles.badge}>
              <Text style={[styles.badgeEmoji, !b.earned && styles.badgeLocked]}>{b.emoji}</Text>
              <Text style={styles.badgeLbl}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button
        title="VIEW MY REFORMER CARD 🪪"
        onPress={() => nav.push('/reformer-card')}
        style={styles.cardBtn}
      />

      <View style={styles.settings}>
        <Pressable style={styles.setRow} onPress={() => Alert.alert('Coming soon', 'Language & preferences')}>
          <Text style={styles.setTxt}>Language</Text>
          <Text style={styles.setChev}>›</Text>
        </Pressable>
        <Pressable style={styles.setRow} onPress={() => Alert.alert('Coming soon', 'Notifications')}>
          <Text style={styles.setTxt}>Notifications</Text>
          <Text style={styles.setChev}>›</Text>
        </Pressable>
        <Pressable style={styles.setRow} onPress={() => void onLogout()}>
          <Text style={[styles.setTxt, { color: Colors.danger }]}>Logout</Text>
        </Pressable>
      </View>

      <EditProfileModal
        visible={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSave={onSaveProfile}
      />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLbl}>{label}</Text>
      <Text style={styles.detailVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.white,
  },
  editBtn: {
    padding: Spacing.xs,
  },
  headerInner: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: Colors.saffron,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.navyMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.white,
  },
  name: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.display,
    fontSize: 24,
    color: Colors.white,
  },
  refId: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  role: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statusTxt: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexWrap: 'nowrap',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    minWidth: '22%',
  },
  statNum: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    color: Colors.saffron,
  },
  statLbl: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  detailCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  detailRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  detailLbl: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailVal: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
  },
  scoreCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreTitle: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.white,
  },
  scoreVal: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Colors.saffron,
  },
  scoreHint: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  badgesCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgesTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badge: {
    width: '22%',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLocked: {
    opacity: 0.35,
  },
  badgeLbl: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  settings: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  setTxt: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
  },
  setChev: {
    fontSize: 22,
    color: Colors.saffron,
  },
});
