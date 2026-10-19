import type { UnitColor } from '@chao/shared';

/**
 * Chao palette, inspired by the South of Vietnam: Mekong jade water, Hội An
 * lantern red, lotus pink, gold of the flag's star, bamboo green and the warm
 * cream of rice paper. These saturated tones (with a darker `shade`) are the
 * river map's illustration colors and the unit colors.
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

  white: '#FFFFFF',
} as const;

/**
 * Interface palette: calmer tones of the same Vietnam. Flag red and the gold of
 * its star lead, with celadon (gốm men ngọc), lacquer ember, indigo and the ink
 * and rice paper of calligraphy. Each color has a `deep` tone for text/icons on
 * its `soft` tint.
 */
const ui = {
  red: '#C8312A',
  redDeep: '#9C231D',
  redSoft: '#FBEBE8',

  star: '#E3A20B',
  starDeep: '#8A6206',
  starSoft: '#FCF3DC',

  celadon: '#2E7D5E',
  celadonDeep: '#1F5C44',
  celadonSoft: '#E4F1EA',

  ember: '#D2611C',
  emberDeep: '#984210',
  emberSoft: '#FCEBDD',

  indigo: '#34567C',
  indigoDeep: '#243E5C',
  indigoSoft: '#E7EDF4',

  rose: '#B44A72',
  roseDeep: '#8A3155',
  roseSoft: '#F8E7EE',

  ink: '#1F1B18',
  inkSoft: '#655D55',
  inkMuted: '#9D948A',
  line: '#E8E2D8',
  lineStrong: '#D3CABD',
  paper: '#FAF7F2',
  paperDeep: '#F2EDE5',
} as const;

/**
 * Semantic tokens: components use these, never raw palette values.
 * `*Shade` is the deep tone of a color, for text and icons on its `*Soft` tint.
 */
export const colors = {
  background: ui.paper,
  surface: palette.white,
  /** Pressed rows, selected tiles, inset boxes. */
  surfaceMuted: ui.paperDeep,
  border: ui.line,
  borderShade: ui.lineStrong,

  text: ui.ink,
  textSecondary: ui.inkSoft,
  textMuted: ui.inkMuted,
  textOnColor: palette.white,

  primary: ui.red,
  primaryShade: ui.redDeep,
  primarySoft: ui.redSoft,

  /** Brand red (logo, highlights). */
  accent: ui.red,
  accentShade: ui.redDeep,
  accentSoft: ui.redSoft,

  success: ui.celadon,
  successShade: ui.celadonDeep,
  successSoft: ui.celadonSoft,

  danger: ui.red,
  dangerShade: ui.redDeep,
  dangerSoft: ui.redSoft,

  xp: ui.star,
  xpShade: ui.starDeep,
  xpSoft: ui.starSoft,

  streak: ui.ember,
  streakShade: ui.emberDeep,
  streakSoft: ui.emberSoft,

  info: ui.indigo,
  infoShade: ui.indigoDeep,
  infoSoft: ui.indigoSoft,

  lotus: ui.rose,
  lotusShade: ui.roseDeep,
  lotusSoft: ui.roseSoft,

  paper: ui.paper,

  disabled: ui.paperDeep,
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
