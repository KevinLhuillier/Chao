import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../colors';
import { haptics } from '../haptics';
import { borderWidth, radii, spacing } from '../spacing';

export type CardProps = {
  children: ReactNode;
  /** When set, the card becomes pressable (darkens slightly while pressed). */
  onPress?: () => void;
  tint?: { background: string; border: string };
  padding?: number;
  style?: ViewStyle;
};

/** Rounded surface with a thin border. */
export function Card({ children, onPress, tint, padding = spacing.lg, style }: CardProps) {
  const look = {
    backgroundColor: tint?.background ?? colors.surface,
    borderColor: tint?.border ?? colors.border,
    padding,
  };

  if (!onPress) {
    return <View style={[styles.card, look, style]}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.card, look, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.md, borderWidth },
  pressed: { backgroundColor: colors.surfaceMuted },
});
