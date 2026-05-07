import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

export function MetricCard({
  value,
  label,
  valueColor = Colors.saffron,
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    alignItems: 'center',
    minWidth: '45%',
  },
  value: {
    fontFamily: FontFamily.display,
    fontSize: 28,
  },
  label: {
    marginTop: Spacing.xs,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
