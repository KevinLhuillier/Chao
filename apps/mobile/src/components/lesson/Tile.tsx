import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Text, borderWidth, colors, haptics, radii, spacing } from '@/theme';

export type TileState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim' | 'used';

const LOOK: Record<TileState, { background: string; border: string; text: string }> = {
  idle: { background: colors.surface, border: colors.borderShade, text: colors.text },
  selected: { background: colors.surfaceMuted, border: colors.text, text: colors.text },
  right: { background: colors.successSoft, border: colors.success, text: colors.successShade },
  wrong: { background: colors.dangerSoft, border: colors.danger, text: colors.dangerShade },
  dim: { background: colors.surface, border: colors.border, text: colors.textMuted },
  used: { background: colors.surfaceMuted, border: colors.surfaceMuted, text: 'transparent' },
};

type Props = {
  label: string;
  state?: TileState;
  onPress?: () => void;
  /** Vietnamese text: taller line height for tone marks. */
  vi?: boolean;
  compact?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/** Answer tile (options, pairs, sentence words): flat, outlined, darkens while pressed. */
export function Tile({ label, state = 'idle', onPress, vi, compact, disabled, style }: Props) {
  const look = LOOK[state];
  const inactive = disabled || state === 'used' || state === 'dim';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, selected: state === 'selected' }}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.tile,
        compact && styles.compact,
        { backgroundColor: look.background, borderColor: look.border },
        state === 'dim' && styles.dim,
        pressed && state === 'idle' && styles.pressed,
        style,
      ]}>
      <Text
        variant={vi ? 'vi' : 'bodyBold'}
        color={look.text}
        align="center"
        style={compact ? styles.compactText : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 56,
    borderRadius: radii.sm,
    // Thicker than other borders so the selected/right/wrong outline reads at a glance.
    borderWidth: borderWidth * 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  compactText: { fontSize: 17 },
  dim: { opacity: 0.55 },
  pressed: { backgroundColor: colors.surfaceMuted },
});
