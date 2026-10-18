import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { Button, IconBubble, Text, colors, spacing } from '@/theme';

import { Sheet } from './Sheet';

type Props = {
  visible: boolean;
  icon: LucideIcon;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (red confirm button). */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-app confirmation dialog (replaces the system Alert), in the app's style. */
export function ConfirmSheet({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel = t.common.cancel,
  tone = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const danger = tone === 'danger';
  return (
    <Sheet visible={visible} onClose={onCancel}>
      <IconBubble
        icon={icon}
        diameter={72}
        color={danger ? colors.dangerShade : colors.primary}
        background={danger ? colors.dangerSoft : colors.primarySoft}
      />
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text align="center" color={colors.textSecondary}>
        {message}
      </Text>
      <View style={styles.actions}>
        <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} />
        <Button label={cancelLabel} variant="secondary" haptic="tap" onPress={onCancel} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
