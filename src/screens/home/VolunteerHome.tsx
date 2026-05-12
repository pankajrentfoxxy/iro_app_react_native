import { LinearGradient } from 'expo-linear-gradient';
import { nav } from '@/src/navigation/nav';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { MetricCard } from '@/src/components/ui/MetricCard';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAppSelector } from '@/src/store';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { SurveyFormModal } from '@/src/components/survey/SurveyFormModal';

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'I';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[1][0]}`.toUpperCase();
}

function useCountUp(target: number, durationMs = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const from = 0;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      setV(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, target]);
  return v;
}

export function VolunteerHome() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const name = user?.name ?? 'Reformer';
  const state = user?.state ?? 'India';
  const network = user?.networkCount ?? 47;
  const live = useCountUp(842391, 1600);

  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [ring]);
  const livePulse = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.5 * ring.value,
  }));

  const progress = Math.min(1, network / 100);
  const remainder = Math.max(0, 100 - network);
  const [surveyOpen, setSurveyOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>🔥</Text>
        <Text style={styles.jai}>जय IRO 🔥</Text>
        <Pressable style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...Gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.welcome}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials(name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeHi}>Jai IRO, {name}!</Text>
              <View style={styles.badgeRow}>
                <Badge label="REFORMER" />
                <Text style={styles.state}> • {state}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.metric}>{network}</Text>
          <Text style={styles.metricLbl}>Reformers in your network</Text>
          <ProgressBar progress={progress} />
          <Text style={styles.milestone}>
            {remainder} more → 🏅 Bronze Badge
          </Text>
        </LinearGradient>

        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <Animated.View style={[styles.pulse, livePulse]} />
            <Text style={styles.liveLbl}>LIVE</Text>
          </View>
          <Text style={styles.liveNum}>{live.toLocaleString('en-IN')}</Text>
          <Text style={styles.liveCap}>Total IRO Reformers</Text>
          <Text style={styles.liveGrowth}>+1,247 joined today ↑</Text>
        </View>

        <SectionHeader title="Quick actions" />
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => nav.push('/network')}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionLbl}>Share</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => setSurveyOpen(true)}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLbl}>Survey</Text>
          </Pressable>
          <Pressable style={styles.action}>
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionLbl}>Tasks</Text>
          </Pressable>
          <Pressable style={styles.action}>
            <Text style={styles.actionIcon}>🎪</Text>
            <Text style={styles.actionLbl}>Events</Text>
          </Pressable>
        </View>

        <SectionHeader title="My stats" />
        <View style={styles.grid}>
          <MetricCard value={String(user?.directReferrals ?? 12)} label="Direct Referrals" />
          <MetricCard
            value={`#${user?.nationalRank ?? 247}`}
            label="National Rank"
            valueColor={Colors.info}
          />
        </View>
        <View style={styles.grid}>
          <MetricCard
            value={`🔥 ${user?.dayStreak ?? 12}`}
            label="Day Streak"
            valueColor={Colors.warning}
          />
          <MetricCard
            value={String(user?.surveyScore ?? 4.7)}
            label="Survey Score"
            valueColor={Colors.success}
          />
        </View>

        <View style={styles.taskCard}>
          <Text style={styles.taskTag}>📋 TODAY&apos;S TASK</Text>
          <Text style={styles.taskTitle}>Share today&apos;s IRO message in your group</Text>
          <Text style={styles.taskDue}>Due: 6:00 PM</Text>
          <Button title="DO NOW →" variant="outline" onPress={() => nav.push('/network')} style={styles.taskBtn} />
        </View>

        <View style={styles.announce}>
          <Badge label="📢 ANNOUNCEMENT" tone="info" />
          <Text style={styles.announceTxt}>Town hall this Saturday — reformer briefing on booth outreach.</Text>
          <Text style={styles.announceTime}>2 hours ago</Text>
        </View>

        <View style={styles.shareCard}>
          <Badge label="📱 SHARE NOW" />
          <Text style={styles.shareTxt}>“भारत बदलेगा — आइए IRO के साथ जुड़ें।”</Text>
          <Text style={styles.shareMeta}>3,421 Reformers shared</Text>
          <Button title="SHARE →" onPress={() => nav.push('/network')} style={{ marginTop: Spacing.md }} />
        </View>
      </ScrollView>

      <SurveyFormModal visible={surveyOpen} onClose={() => setSurveyOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.navy,
  },
  logo: {
    fontSize: 22,
  },
  jai: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 16,
    color: Colors.saffron,
  },
  bell: {
    position: 'relative',
    padding: Spacing.xs,
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  welcome: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  welcomeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    color: Colors.white,
  },
  welcomeHi: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  state: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  metric: {
    marginTop: Spacing.lg,
    fontFamily: FontFamily.display,
    fontSize: 48,
    color: Colors.saffron,
  },
  metricLbl: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  milestone: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  liveCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg - 2,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveLbl: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.success,
    letterSpacing: 1,
  },
  liveNum: {
    fontFamily: FontFamily.display,
    fontSize: 36,
    color: Colors.white,
  },
  liveCap: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  liveGrowth: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.success,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  action: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  actionLbl: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  taskCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.saffron,
    marginBottom: Spacing.md,
  },
  taskTag: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 11,
    color: Colors.saffron,
    letterSpacing: 1,
  },
  taskTitle: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.white,
  },
  taskDue: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  taskBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-end',
  },
  announce: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  announceTxt: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.white,
  },
  announceTime: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  shareCard: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareTxt: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.white,
  },
  shareMeta: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
