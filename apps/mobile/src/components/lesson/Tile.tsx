import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text, colors, depth, haptics, radii, spacing, usePressDepth } from '@/theme';

export type TileState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim' | 'used';

const LOOK: Record<TileState, { face: string; edge: string; border: string; text: string }> = {
  idle: {
    face: colors.surface,
    edge: colors.borderShade,
    border: colors.border,
    text: colors.text,
  },
  selected: {
    face: colors.primarySoft,
    edge: colors.primary,
    border: colors.primary,
    text: colors.primaryShade,
  },
  right: {
    face: colors.successSoft,
    edge: colors.success,
    border: colors.success,
    text: colors.successShade,
  },
  wrong: {
    face: colors.dangerSoft,
    edge: colors.danger,
    border: colors.danger,
    text: colors.dangerShade,
  },
  dim: { face: colors.surface, edge: colors.border, border: colors.border, text: colors.textMuted },
  used: { face: colors.border, edge: colors.border, border: colors.border, text: 'transparent' },
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

/** Answer tile (options, pairs, sentence words) with the app's 3D press. */
export function Tile({ label, state = 'idle', onPress, vi, compact, disabled, style }: Props) {
  const look = LOOK[state];
  const inactive = disabled || state === 'used' || state === 'dim';
  const { faceStyle, pressIn, pressOut } = usePressDepth(inactive ? 0 : depth.card);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, selected: state === 'selected' }}
      accessibilityLabel={label}
      disabled={inactive}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      style={[{ paddingBottom: depth.card }, style]}>
      <View style={[styles.edge, { top: depth.card, backgroundColor: look.edge }]} />
      <Animated.View
        style={[
          styles.face,
          compact && styles.compact,
          { backgroundColor: look.face, borderColor: look.border },
          state === 'dim' && styles.dim,
          faceStyle,
        ]}>
        <Text
          variant={vi ? 'vi' : 'bodyBold'}
          color={look.text}
          align="center"
          style={compact ? styles.compactText : undefined}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: radii.md },
  face: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  compactText: { fontSize: 17 },
  dim: { opacity: 0.55 },
});
