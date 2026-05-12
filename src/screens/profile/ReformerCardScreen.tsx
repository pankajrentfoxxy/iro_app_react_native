import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { nav } from '@/src/navigation/nav';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Button } from '@/src/components/ui/Button';
import { useAppSelector } from '@/src/store';
import type { UserProfile } from '@/src/types/user.types';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

const JOIN_BASE = 'https://iro.in/join?ref=';

function roleBadgeLabel(user: UserProfile | null | undefined): string {
  const apiName = user?.roleName?.trim();
  if (apiName) return apiName.toUpperCase();
  const r = user?.role ?? 'reformer';
  return r.replace(/_/g, ' ').toUpperCase();
}

function memberSinceLabel(joinedAt?: string | null): string {
  if (!joinedAt?.trim()) return 'Reformer since —';
  const d = new Date(joinedAt);
  if (Number.isNaN(d.getTime())) return 'Reformer since —';
  const month = d.toLocaleString(undefined, { month: 'short' });
  const year = d.getFullYear();
  return `Reformer since ${month} ${year}`;
}

function locationMeta(u: UserProfile | null | undefined): string {
  if (!u) return 'India';
  const d = (u.district ?? '').trim();
  const s = (u.state ?? '').trim();
  if (d && s) return `${d}, ${s}`;
  if (s) return s;
  if (d) return d;
  return 'India';
}

export function ReformerCardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const name = user?.name ?? 'Reformer';
  const id = user?.reformerId ?? 'IRO-DEMO';
  const link = `${JOIN_BASE}${encodeURIComponent(id)}`;

  const badgeText = useMemo(() => roleBadgeLabel(user ?? null), [user]);
  const joinedText = useMemo(() => memberSinceLabel(user?.joinedAt), [user?.joinedAt]);

  const share = async () => {
    try {
      await Share.share({
        message: `My IRO Reformer Card — ${name} (${id})\n${link}`,
      });
    } catch {
      /* noop */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.card}>
        <LinearGradient colors={[...Gradients.hero]} style={styles.cardInner}>
          <View style={styles.tricolorTop} />
          <View style={styles.topRow}>
            <Text style={styles.logo}>🔥</Text>
            <Text style={styles.org}>INDIAN REPUBLIC ORG</Text>
          </View>
          <Text style={styles.badge}>{badgeText}</Text>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{name.trim().slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.ref}>{id}</Text>
          <Text style={styles.meta}>{locationMeta(user)}</Text>
          <Text style={styles.joined}>{joinedText}</Text>
          <View style={styles.rowBottom}>
            <View style={{ flex: 1 }} />
            <View style={styles.qr}>
              <QRCode value={link} size={80} backgroundColor={Colors.white} color={Colors.navy} />
            </View>
          </View>
          <View style={styles.tricolorBottom} />
        </LinearGradient>
      </View>

      <Button title="📤 SHARE MY CARD" onPress={() => void share()} style={styles.btn} />
      <Button title="Close" variant="outline" onPress={() => nav.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  cardInner: {
    width: 320,
    minHeight: 460,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  tricolorTop: {
    height: 9,
    backgroundColor: Colors.saffron,
    borderBottomWidth: 3,
    borderBottomColor: Colors.white,
  },
  tricolorBottom: {
    height: 9,
    backgroundColor: Colors.success,
    borderTopWidth: 3,
    borderTopColor: Colors.white,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  logo: {
    fontSize: 28,
  },
  org: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.saffron,
    letterSpacing: 3,
  },
  avatarRing: {
    marginTop: Spacing.md,
    alignSelf: 'center',
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
  avatarInitial: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    color: Colors.white,
  },
  name: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontFamily: FontFamily.display,
    fontSize: 24,
    color: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  ref: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  meta: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  joined: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  qr: {
    backgroundColor: Colors.white,
    padding: Spacing.xs,
    borderRadius: Radius.sm,
  },
  btn: {
    marginBottom: Spacing.md,
  },
});
