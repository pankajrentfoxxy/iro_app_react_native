import { LinearGradient } from 'expo-linear-gradient';
import { nav } from '@/src/navigation/nav';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { logout } from '@/src/store/auth.slice';
import { storage } from '@/src/utils/storage';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'I';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[1][0]}`.toUpperCase();
}

const BADGES = [
  { emoji: '🌱', label: 'Joined', earned: true },
  { emoji: '✅', label: 'First Task', earned: true },
  { emoji: '📋', label: 'First Survey', earned: false },
  { emoji: '🎪', label: 'First Event', earned: false },
] as const;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const name = user?.name ?? 'Reformer';
  const id = user?.reformerId ?? 'IRO-DEMO';
  const score = 78;

  const onLogout = async () => {
    await storage.clearAuth();
    dispatch(logout());
    nav.replace('/welcome');
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[...Gradients.hero]} style={styles.header}>
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
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.directReferrals ?? 12}</Text>
          <Text style={styles.statLbl}>Referrals</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user?.networkCount ?? 47}</Text>
          <Text style={styles.statLbl}>Network</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>18</Text>
          <Text style={styles.statLbl}>Tasks</Text>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Leadership Score</Text>
        <Text style={styles.scoreVal}>{score}/100</Text>
        <ProgressBar progress={score / 100} />
        <Text style={styles.scoreHint}>Keep referring and finishing tasks to climb the leaderboard.</Text>
      </View>

      <View style={styles.badgesCard}>
        <Text style={styles.badgesTitle}>My badges</Text>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerInner: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
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
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.saffron,
  },
  statLbl: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textSecondary,
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
