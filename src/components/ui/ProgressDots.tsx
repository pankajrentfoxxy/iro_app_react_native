import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        Step {step} of {total}
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i < step;
          return (
            <View
              key={i}
              style={[styles.dot, active ? styles.dotActive : styles.dotIdle]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
    backgroundColor: Colors.navyLight,
  },
  dotActive: {
    height: 8,
    width: 8,
    backgroundColor: Colors.saffron,
  },
  dotIdle: {
    opacity: 0.7,
  },
});
