import {
  createReferralInvite,
  fetchInviteAllowedTargets,
  fetchMyReferralInvites,
  fetchReferralMyNetwork,
  type MyReferralInviteRow,
  type ReferralNetworkResponse,
} from '@/src/api/referralInvites.api';
import { Button } from '@/src/components/ui/Button';
import { messageFromUnknownError } from '@/src/lib/apiError';
import { nav } from '@/src/navigation/nav';
import { useAppSelector } from '@/src/store';
import { Colors } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily, FontSize } from '@/src/theme/typography';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function roleChipStyle(active: boolean) {
  return [styles.chip, active ? styles.chipOn : styles.chipOff];
}

export default function ReferralInvitesScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const roleLevel = useMemo(() => {
    const map: Record<string, string> = {
      president: 'L1',
      national_exec: 'L2',
      state_leader: 'L3',
      district_leader: 'L5',
      block_leader: 'L6',
      booth_worker: 'L7',
      volunteer: 'L8',
      reformer: 'L8',
    };
    return map[user?.role ?? ''] ?? 'L8';
  }, [user?.role]);

  const [allowed, setAllowed] = useState<string[]>([]);
  const [loadingAllowed, setLoadingAllowed] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastInvite, setLastInvite] = useState<{ code: string; targetRole: string; maxUses: number } | null>(
    null
  );
  const [invites, setInvites] = useState<MyReferralInviteRow[]>([]);
  const [network, setNetwork] = useState<ReferralNetworkResponse | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deepJoinUrl = useMemo(() => {
    if (!lastInvite?.code) return '';
    return Linking.createURL('/auth/register', {
      queryParams: { invite: lastInvite.code },
    });
  }, [lastInvite?.code]);

  const refreshLists = useCallback(async () => {
    setLoadingLists(true);
    setError(null);
    try {
      const [inv, net] = await Promise.all([fetchMyReferralInvites(), fetchReferralMyNetwork()]);
      setInvites(inv);
      setNetwork(net);
    } catch (e) {
      setError(messageFromUnknownError(e));
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAllowed(true);
      try {
        const levels = await fetchInviteAllowedTargets();
        if (!cancelled) {
          setAllowed(levels);
          setSelected(levels[0] ?? null);
        }
      } catch {
        if (!cancelled) setAllowed([]);
      } finally {
        if (!cancelled) setLoadingAllowed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  const onCreate = async () => {
    if (!selected) {
      Alert.alert('Pick a role', 'Choose which role this invite will assign.');
      return;
    }
    setCreating(true);
    try {
      const out = await createReferralInvite({ targetRoleLevel: selected, maxUses: 1 });
      setLastInvite(out);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshLists();
    } catch (e) {
      Alert.alert('Could not create invite', messageFromUnknownError(e));
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', code);
  };

  const shareInvite = async (code: string) => {
    const url = Linking.createURL('/auth/register', { queryParams: { invite: code } });
    try {
      await Share.share({
        message:
          `Join IRO with my invite (${code}). Role is assigned securely when you register.\n\nOpen in app: ${url}`,
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headRow}>
        <Pressable onPress={() => nav.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Referral invites</Text>
        <View style={{ width: 56 }} />
      </View>
      <Text style={styles.sub}>Signed in as {user?.name ?? 'Reformer'} · approx {roleLevel}</Text>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 24 }}>
        {loadingAllowed ? <ActivityIndicator color={Colors.saffron} /> : null}

        {!loadingAllowed && allowed.length === 0 ? (
          <Text style={styles.hint}>Your role cannot create hierarchical invites.</Text>
        ) : null}

        {allowed.length > 0 ? (
          <>
            <Text style={styles.section}>Target role for new member</Text>
            <View style={styles.chipWrap}>
              {allowed.map((lvl) => (
                <Pressable key={lvl} onPress={() => setSelected(lvl)} style={roleChipStyle(selected === lvl)}>
                  <Text style={[styles.chipTxt, selected === lvl ? styles.chipTxtOn : undefined]}>{lvl}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={creating ? 'Generating…' : 'Generate invite'} loading={creating} onPress={() => void onCreate()} />
          </>
        ) : null}

        {lastInvite ? (
          <View style={styles.card}>
            <Text style={styles.cardLbl}>Latest invite</Text>
            <Text style={styles.code}>{lastInvite.code}</Text>
            <Text style={styles.meta}>
              Assigns {lastInvite.targetRole} · max uses {lastInvite.maxUses}
            </Text>
            {deepJoinUrl ? (
              <View style={styles.qr}>
                <QRCode value={deepJoinUrl} size={160} color={Colors.navy} backgroundColor={Colors.white} />
              </View>
            ) : null}
            <View style={styles.row}>
              <Button title="Copy" variant="outline" onPress={() => void copyCode(lastInvite.code)} style={{ flex: 1 }} />
              <Button title="Share" onPress={() => void shareInvite(lastInvite.code)} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>My invites</Text>
        {loadingLists ? <ActivityIndicator color={Colors.saffron} /> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {!loadingLists && invites.length === 0 ? (
          <Text style={styles.hint}>No invites yet — generate one above.</Text>
        ) : null}
        {invites.map((inv) => (
          <View key={inv.id} style={styles.invRow}>
            <Text style={styles.invCode}>{inv.code}</Text>
            <Text style={styles.invMeta}>
              {inv.targetRole} · used {inv.usedCount}/{inv.maxUses} · left {inv.remainingUses}
            </Text>
            <View style={styles.row}>
              <Button title="Copy" variant="outline" onPress={() => void copyCode(inv.code)} />
              <Button title="Share" variant="outline" onPress={() => void shareInvite(inv.code)} />
            </View>
          </View>
        ))}

        <Text style={styles.section}>My network</Text>
        {network ? (
          <>
            <View style={styles.stats}>
              <Text style={styles.statTxt}>Invites: {network.summary.totalInvites}</Text>
              <Text style={styles.statTxt}>Pending slots: {network.summary.pendingInvites}</Text>
              <Text style={styles.statTxt}>Direct joins: {network.summary.directJoinCount}</Text>
            </View>
            <Text style={styles.mini}>By role (direct)</Text>
            {Object.entries(network.joinedByRoleLevel).map(([k, v]) => (
              <Text key={k} style={styles.mini}>
                {k}: {v}
              </Text>
            ))}
            <Text style={[styles.mini, { marginTop: Spacing.sm }]}>Recent joins</Text>
            {network.directDownline.slice(0, 20).map((m) => (
              <Text key={m.userId} style={styles.mini}>
                {m.fullName} · {m.assignedRole ?? '?'} · {m.joinedViaInviteCode ?? 'legacy'}
              </Text>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navy },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  back: { fontFamily: FontFamily.bodySemi, fontSize: FontSize.body, color: Colors.saffron },
  title: { fontFamily: FontFamily.display, fontSize: 20, color: Colors.white },
  sub: {
    paddingHorizontal: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.white,
  },
  hint: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textMuted },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipOff: { borderColor: Colors.border, backgroundColor: Colors.navyLight },
  chipOn: { borderColor: Colors.saffron, backgroundColor: Colors.navyLight },
  chipTxt: { fontFamily: FontFamily.bodySemi, fontSize: FontSize.caption, color: Colors.textSecondary },
  chipTxtOn: { color: Colors.saffron },
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.navyLight,
  },
  cardLbl: { fontFamily: FontFamily.bodySemi, fontSize: FontSize.caption, color: Colors.textMuted },
  code: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.mono,
    fontSize: 22,
    color: Colors.saffron,
  },
  meta: { marginTop: Spacing.xs, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary },
  qr: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
  },
  row: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  invRow: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.navyLight,
  },
  invCode: { fontFamily: FontFamily.mono, fontSize: FontSize.body, color: Colors.saffron },
  invMeta: { marginTop: Spacing.xs, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textMuted },
  stats: { gap: Spacing.xs, marginBottom: Spacing.sm },
  statTxt: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary },
  mini: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textMuted },
  err: { color: Colors.danger, marginBottom: Spacing.sm },
});
