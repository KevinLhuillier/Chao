import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

/**
 * Bottom sheet rendered in a Modal (so it also covers the tab bar).
 *
 * No Reanimated layout animations (`entering`) in here: inside a Modal on
 * Android they can leave the buttons visible but untouchable. The backdrop
 * fades with the Modal itself, the sheet slides up with an animated style.
 */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const offset = useSharedValue(height);
  useEffect(() => {
    if (!visible) return;
    offset.set(height);
    offset.set(withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [visible, height, offset]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityLabel={t.common.close}
        />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }, sheetStyle]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(45,41,38,0.35)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
});
