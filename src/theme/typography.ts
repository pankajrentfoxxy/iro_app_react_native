import type { TextStyle } from 'react-native';

/** Family names must match `useFonts` keys from @expo-google-fonts */
export const FontFamily = {
  display: 'Baloo2_700Bold',
  heading: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const FontSize = {
  hero: 32,
  title: 24,
  heading: 20,
  subheading: 16,
  body: 14,
  caption: 12,
  micro: 10,
} as const;

export const lineHeights: Record<'tight' | 'normal' | 'loose', TextStyle['lineHeight']> = {
  tight: 1.2 * FontSize.body,
  normal: 1.5 * FontSize.body,
  loose: 1.8 * FontSize.body,
};
