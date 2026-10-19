import {
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import type { TextStyle } from 'react-native';

/** Passed to `useFonts` in the root layout. */
export const fontAssets = {
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
};

/** Be Vietnam Pro: drawn for Vietnamese, its tone marks stay crisp and balanced. */
export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  italic: 'BeVietnamPro_400Regular_Italic',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

/**
 * Text variants. The `vi*` ones are for Vietnamese: extra line height so stacked
 * tone marks (ễ, ậ, Ẩ) never get clipped.
 */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 31, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.semiBold, fontSize: 19, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 24 },
  viDisplay: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 50, letterSpacing: -0.3 },
  viHeading: { fontFamily: fonts.semiBold, fontSize: 22, lineHeight: 34 },
  vi: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 29 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
