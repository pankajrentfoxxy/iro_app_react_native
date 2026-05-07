import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Radius, Spacing } from '@/src/theme/spacing';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navyLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
