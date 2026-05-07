import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

export function Badge({ label, tone = 'saffron' }: { label: string; tone?: 'saffron' | 'info' | 'muted' }) {
  const bg =
    tone === 'saffron'
      ? Colors.saffronPale
      : tone === 'info'
        ? Colors.infoLight
        : Colors.navyMedium;
  const fg =
    tone === 'saffron' ? Colors.saffron : tone === 'info' ? Colors.info : Colors.textSecondary;

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  text: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.micro,
    letterSpacing: 0.8,
  },
});
