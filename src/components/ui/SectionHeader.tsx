import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
  },
});
