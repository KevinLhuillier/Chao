import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text, borderWidth, colors, enter, radii, spacing } from '@/theme';

import { AudioButton } from '../AudioButton';

type Props = {
  instruction: string;
  /** Main text (a Vietnamese word, a sentence, a meaning). */
  text?: string;
  vi?: boolean;
  audio?: string | null;
  /** Listening exercise: the recording is the prompt (big button, plays at once). */
  listen?: boolean;
  tint: { solid: string; shade: string; soft: string };
};

/** Top of an exercise: the instruction, then what to translate or listen to. */
export function Prompt({ instruction, text, vi, audio, listen, tint }: Props) {
  return (
    <Animated.View entering={enter.up()} style={styles.wrap}>
      <Text variant="heading">{instruction}</Text>
      {listen && audio ? (
        <View style={styles.listen}>
          <AudioButton key={audio} uri={audio} autoPlay size="lg" slow />
        </View>
      ) : text ? (
        <View style={styles.bubble}>
          {audio ? <AudioButton key={audio} uri={audio} autoPlay size="sm" /> : null}
          <Text
            variant={vi ? 'viHeading' : 'heading'}
            color={vi ? tint.shade : colors.text}
            style={styles.flex}>
            {text}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  listen: { alignItems: 'center', paddingVertical: spacing.md },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flex: { flex: 1 },
});
