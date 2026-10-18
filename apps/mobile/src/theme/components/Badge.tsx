import { useEffect, useRef } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '../colors';
import { springs } from '../motion';
import { radii, spacing } from '../spacing';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

type Tone = { bg: string; fg: string };

const tones = {
  neutral: { bg: colors.border, fg: colors.textSecondary },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  xp: { bg: colors.xpSoft, fg: colors.xpShade },
  streak: { bg: colors.streakSoft, fg: colors.streakShade },
  success: { bg: colors.successSoft, fg: colors.successShade },
  accent: { bg: colors.accentSoft, fg: colors.accentShade },
  lotus: { bg: colors.lotusSoft, fg: colors.lotusShade },
} satisfies Record<string, Tone>;

export type BadgeTone = keyof typeof tones;

export type BadgeProps = {
  label: string | number;
  /** Leading icon, tinted like the label. */
  icon?: LucideIcon;
  tone?: BadgeTone;
  /** Custom color, e.g. a unit color (overrides `tone`). */
  tint?: { solid: string; shade: string; soft: string };
  /** Filled variant: solid background, white text. */
  solid?: boolean;
  style?: ViewStyle;
};

/** Pill badge. Gently pops when its label changes (e.g. XP or streak going up). */
export function Badge({ label, icon, tone = 'neutral', tint: custom, solid, style }: BadgeProps) {
  const tint: Tone = custom
    ? solid
      ? { bg: custom.solid, fg: colors.textOnColor }
      : { bg: custom.soft, fg: custom.shade }
    : tones[tone];

  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.set(withSequence(withSpring(1.08, springs.pop), withSpring(1, springs.pop)));
  }, [label, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.badge, { backgroundColor: tint.bg }, animatedStyle, style]}>
      {icon ? <Icon icon={icon} size={16} color={tint.fg} /> : null}
      <Text variant="caption" color={tint.fg} style={styles.label}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  label: { fontSize: 14 },
});
