import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { useAppSelector } from '@/src/store';

const JOIN_BASE = 'https://iro.in/join?ref=';

export function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const code = user?.reformerId ?? 'IRO-DEMO';
  const link = `${JOIN_BASE}${encodeURIComponent(code)}`;
  const [tab, setTab] = useState<'tree' | 'share'>('tree');

  const msg = useMemo(
    () =>
      `नमस्ते! मैं IRO का सदस्य हूँ — भारत बदलने का एक आंदोलन।\nमेरे link से join करें और Reformer बनें 🔥\n${link}`,
    [link]
  );

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Referral code copied to clipboard');
  };

  const shareWhatsAppStyle = async () => {
    try {
      await Share.share({ message: msg });
    } catch {
      /* noop */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>Network</Text>
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('tree')} style={[styles.tab, tab === 'tree' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'tree' && styles.tabTxtOn]}>My tree</Text>
          {tab === 'tree' ? <View style={styles.tabLine} /> : null}
        </Pressable>
        <Pressable onPress={() => setTab('share')} style={[styles.tab, tab === 'share' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'share' && styles.tabTxtOn]}>Share</Text>
          {tab === 'share' ? <View style={styles.tabLine} /> : null}
        </Pressable>
      </View>

      {tab === 'tree' ? (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.treeCard}>
            <Svg width="100%" height={220} viewBox="0 0 340 220">
              <Line x1="170" y1="110" x2="90" y2="170" stroke={Colors.saffron} strokeWidth="1.5" />
              <Line x1="170" y1="110" x2="250" y2="170" stroke={Colors.saffron} strokeWidth="1.5" />
              <Line x1="90" y1="170" x2="55" y2="205" stroke={Colors.saffron} strokeWidth="1.5" />
              <Line x1="90" y1="170" x2="115" y2="205" stroke={Colors.saffron} strokeWidth="1.5" />
              <Line x1="250" y1="170" x2="225" y2="205" stroke={Colors.saffron} strokeWidth="1.5" />
              <Line x1="250" y1="170" x2="285" y2="205" stroke={Colors.saffron} strokeWidth="1.5" />

              <Circle cx="170" cy="90" r="34" fill={Colors.saffron} />

              <Circle cx="90" cy="170" r="26" fill={Colors.navyLight} stroke={Colors.saffron} strokeWidth="2" />
              <Circle cx="250" cy="170" r="26" fill={Colors.navyLight} stroke={Colors.saffron} strokeWidth="2" />
              <Circle cx="55" cy="210" r="18" fill={Colors.navyMedium} />
              <Circle cx="115" cy="210" r="18" fill={Colors.navyMedium} />
              <Circle cx="225" cy="210" r="18" fill={Colors.navyMedium} />
              <Circle cx="285" cy="210" r="18" fill={Colors.navyMedium} />
            </Svg>
          </View>

          <SectionHeader title="Your impact" />
          <Text style={styles.body}>
            You&apos;ve brought <Text style={styles.em}>{user?.directReferrals ?? 12}</Text> Reformers directly.
          </Text>
          <Text style={styles.body}>
            Your extended network: <Text style={styles.em}>{user?.networkCount ?? 47}</Text> total
          </Text>
          <ProgressBar progress={0.55} />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qrCard}>
            <QRCode value={link} size={200} backgroundColor={Colors.white} color={Colors.navy} />
          </View>
          <Text style={styles.mono}>{code}</Text>

          <View style={styles.codeRow}>
            <Text style={styles.codeBig}>{code}</Text>
            <Button title="Copy 📋" variant="outline" onPress={() => void copyCode()} style={styles.copyBtn} />
          </View>

          <Text style={styles.shareLbl}>Share</Text>
          <View style={styles.shareGrid}>
            <Button title="📱 Invite" onPress={() => void shareWhatsAppStyle()} />
            <Button title="💬 Message" variant="outline" onPress={() => void shareWhatsAppStyle()} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  screenTitle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  tab: {
    paddingVertical: Spacing.md,
  },
  tabOn: {},
  tabTxt: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.textMuted,
  },
  tabTxtOn: {
    color: Colors.saffron,
  },
  tabLine: {
    marginTop: Spacing.xs,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.saffron,
  },
  treeCard: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  em: {
    color: Colors.saffron,
    fontFamily: FontFamily.bodySemi,
  },
  qrCard: {
    alignSelf: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  mono: {
    textAlign: 'center',
    fontFamily: FontFamily.mono,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  codeBig: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 22,
    color: Colors.saffron,
  },
  copyBtn: {
    flex: 0,
    paddingHorizontal: Spacing.sm,
  },
  shareLbl: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.body,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  shareGrid: {
    gap: Spacing.sm,
  },
});
