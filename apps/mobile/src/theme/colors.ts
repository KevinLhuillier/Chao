import type { UnitColor } from '@chao/shared';

/**
 * Chao palette, inspired by the South of Vietnam: Mekong jade water, Hội An
 * lantern red, lotus pink, gold of the flag's star, bamboo green and the warm
 * cream of rice paper. Each "solid" color comes with a darker `shade` used for
 * the 3D bottom edge of buttons/cards (the pressed effect moves the face onto it).
 */
export const palette = {
  jade: '#0E9C8C',
  jadeShade: '#09766A',
  jadeSoft: '#DCF3EF',

  lantern: '#E8483B',
  lanternShade: '#B92F25',
  lanternSoft: '#FDE5E2',

  lotus: '#F06C9B',
  lotusShade: '#C94877',
  lotusSoft: '#FDE6EF',

  gold: '#FFBE2E',
  goldShade: '#D69A0B',
  goldSoft: '#FFF3D6',

  flame: '#FF8A2A',
  flameShade: '#D9690C',
  flameSoft: '#FFEBD9',

  bamboo: '#7BB33A',
  bambooShade: '#5C8C24',
  bambooSoft: '#ECF5DF',

  sky: '#3E9BE0',
  skyShade: '#2479B8',
  skySoft: '#E1F0FB',

  ink: '#2D2926',
  inkSoft: '#6E655D',
  inkMuted: '#A89F96',
  line: '#EDE4D6',
  lineShade: '#DCCFBC',
  cream: '#FFF9EE',
  paper: '#FFFDF7',
  white: '#FFFFFF',
} as const;

/** Semantic tokens: components use these, never raw palette values. */
export const colors = {
  background: palette.cream,
  surface: palette.white,
  border: palette.line,
  borderShade: palette.lineShade,

  text: palette.ink,
  textSecondary: palette.inkSoft,
  textMuted: palette.inkMuted,
  textOnColor: palette.white,

  primary: palette.jade,
  primaryShade: palette.jadeShade,
  primarySoft: palette.jadeSoft,

  /** Brand red (logo, lanterns, highlights). */
  accent: palette.lantern,
  accentShade: palette.lanternShade,
  accentSoft: palette.lanternSoft,

  success: palette.bamboo,
  successShade: palette.bambooShade,
  successSoft: palette.bambooSoft,

  danger: palette.lantern,
  dangerShade: palette.lanternShade,
  dangerSoft: palette.lanternSoft,

  xp: palette.gold,
  xpShade: palette.goldShade,
  xpSoft: palette.goldSoft,

  streak: palette.flame,
  streakShade: palette.flameShade,
  streakSoft: palette.flameSoft,

  info: palette.sky,
  infoShade: palette.skyShade,
  infoSoft: palette.skySoft,

  lotus: palette.lotus,
  lotusShade: palette.lotusShade,
  lotusSoft: palette.lotusSoft,

  paper: palette.paper,

  disabled: palette.line,
  disabledShade: palette.lineShade,
} as const;

/** The river map: Mekong water, sandy banks, rice fields, wood and straw. */
export const river = {
  water: '#5CC6D0',
  waterDeep: '#3AA7B5',
  waterLight: '#A4E6EA',
  foam: '#E9FBFC',
  sand: '#F3E2B3',
  sandShade: '#E3CB8E',
  land: '#E6F1D2',
  landDeep: '#D3E6B6',
  paddy: '#B9DC85',
  paddyShade: '#94C25E',
  leaf: '#4FAE5A',
  leafShade: '#36884A',
  leafLight: '#7CCB72',
  trunk: '#9C6B3F',
  trunkShade: '#74481F',
  wood: '#B87A45',
  woodShade: '#8A5428',
  woodLight: '#D49A62',
  straw: '#EDCB7E',
  strawShade: '#C9A04F',
  roof: '#C9573B',
  roofShade: '#9C3D26',
  padLocked: '#C7D1BE',
  padLockedShade: '#A9B59F',
} as const;

type Tint = { solid: string; shade: string; soft: string };

/** One color per unit (theme), picked in the admin. */
export const unitColors: Record<UnitColor, Tint> = {
  jade: { solid: palette.jade, shade: palette.jadeShade, soft: palette.jadeSoft },
  lantern: { solid: palette.lantern, shade: palette.lanternShade, soft: palette.lanternSoft },
  lotus: { solid: palette.lotus, shade: palette.lotusShade, soft: palette.lotusSoft },
  gold: { solid: palette.gold, shade: palette.goldShade, soft: palette.goldSoft },
  bamboo: { solid: palette.bamboo, shade: palette.bambooShade, soft: palette.bambooSoft },
  sky: { solid: palette.sky, shade: palette.skyShade, soft: palette.skySoft },
};

export const unitTint = (color: string): Tint => unitColors[color as UnitColor] ?? unitColors.jade;
