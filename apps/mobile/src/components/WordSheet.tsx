import { localize, type WordRow } from '@chao/shared';
import { Lightbulb, MapPin, Quote } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LANG, t } from '@/i18n';
import { Badge, Button, Icon, Text, colors, radii, spacing } from '@/theme';

import { AudioButton } from './AudioButton';
import { Sheet } from './Sheet';

type Tint = { solid: string; shade: string; soft: string };

/** Details of a learned word: recording, meaning, Northern variant, tip and example. */
export function WordSheet({
  word,
  tint,
  visible,
  onClose,
}: {
  word: WordRow | null;
  tint: Tint;
  visible: boolean;
  onClose: () => void;
}) {
  if (!word) return null;
  const note = localize(word.note, LANG);
  const exampleMeaning = localize(word.example_meaning, LANG);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.flex}>
            {word.kind === 'expression' ? (
              <Badge label={t.words.expression} tint={tint} style={styles.badge} />
            ) : null}
            <Text variant="viDisplay" color={tint.shade}>
              {word.vi}
            </Text>
            <Text variant="heading">{localize(word.meaning, LANG)}</Text>
          </View>
          {word.audio_url ? (
            <AudioButton key={word.audio_url} uri={word.audio_url} autoPlay slow />
          ) : null}
        </View>

        {word.north ? (
          <View style={styles.line}>
            <Icon icon={MapPin} size={18} color={colors.textSecondary} />
            <Text color={colors.textSecondary}>
              {t.lesson.north}: <Text variant="bodyBold">{word.north}</Text>
            </Text>
          </View>
        ) : null}

        {note ? (
          <View style={[styles.box, { backgroundColor: colors.xpSoft }]}>
            <Icon icon={Lightbulb} size={18} color={colors.xpShade} />
            <Text style={styles.flex}>{note}</Text>
          </View>
        ) : null}

        {word.example_vi ? (
          <View style={[styles.box, { backgroundColor: colors.background }]}>
            <Icon icon={Quote} size={18} color={tint.solid} />
            <View style={styles.flex}>
              <Text variant="vi">{word.example_vi}</Text>
              {exampleMeaning ? <Text color={colors.textSecondary}>{exampleMeaning}</Text> : null}
            </View>
            {word.example_audio_url ? (
              <AudioButton key={word.example_audio_url} uri={word.example_audio_url} size="sm" />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <Button
        label={t.common.close}
        haptic="tap"
        colorOverride={{ face: tint.solid, edge: tint.shade }}
        onPress={onClose}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  badge: { marginBottom: spacing.xs },
  flex: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
  },
});
