import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Colors, Gradients } from '@/src/theme/colors';
import { FontFamily, FontSize } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

type Variant = 'primary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  variant?: Variant;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  loading,
  disabled,
  variant = 'primary',
  textStyle,
  style,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const dimmed = disabled || loading;

  if (isPrimary) {
    return (
      <Pressable disabled={dimmed} style={[dimmed && styles.dimmed, style]} {...rest}>
        <LinearGradient
          colors={[...Gradients.saffron]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBase, styles.primaryPad]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.primaryLabel, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={dimmed}
      style={({ pressed }) => [
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        dimmed && styles.dimmed,
        pressed && styles.pressedOutline,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={Colors.saffron} />
      ) : (
        <Text
          style={[
            styles.outlineLabel,
            variant === 'ghost' && styles.ghostLabel,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientBase: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  primaryPad: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.subheading,
    color: Colors.white,
  },
  outline: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.saffron,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
  },
  outlineLabel: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.subheading,
    color: Colors.saffron,
  },
  ghost: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ghostLabel: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
  },
  dimmed: {
    opacity: 0.4,
  },
  pressedOutline: {
    opacity: 0.85,
  },
});
