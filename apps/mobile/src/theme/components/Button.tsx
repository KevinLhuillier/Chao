import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors } from '../colors';
import { haptics } from '../haptics';
import { borderWidth, radii, spacing, touchTarget } from '../spacing';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

type VariantStyle = { background: string; text: string; border?: string };

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: { background: colors.primary, text: colors.textOnColor },
  success: { background: colors.success, text: colors.textOnColor },
  danger: { background: colors.danger, text: colors.textOnColor },
  secondary: { background: colors.surface, text: colors.text, border: colors.borderShade },
  ghost: { background: 'transparent', text: colors.primary },
};

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Overrides the variant background (e.g. a unit color). */
  color?: string;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  /** Use 'none' for frequent taps where a vibration would be annoying. */
  haptic?: 'press' | 'tap' | 'none';
  /** Lighter weight, for labels that are sentences (e.g. a link). */
  sentence?: boolean;
  style?: ViewStyle;
};

/** Flat button: solid fill, dims slightly while pressed, with haptic feedback. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  color,
  icon,
  disabled,
  loading,
  haptic = 'press',
  sentence,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const v = variants[variant];
  const background = inactive && variant !== 'ghost' ? colors.disabled : (color ?? v.background);
  const textColor = inactive ? colors.textMuted : v.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (haptic !== 'none') haptics[haptic]();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        v.border && !inactive && { borderWidth, borderColor: v.border },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text
            variant={sentence ? 'body' : 'button'}
            color={textColor}
            align="center"
            style={styles.label}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.82 },
  label: { flexShrink: 1 },
});
