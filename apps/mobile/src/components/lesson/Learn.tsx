import { localize } from '@chao/shared';
import { Lightbulb, MapPin, Quote } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { LANG, t } from '@/i18n';
import { Badge, Card, Icon, Text, colors, enter, radii, spacing } from '@/theme';

import { AudioButton } from '../AudioButton';
import type { ExerciseProps } from './types';

/** Lesson card: introduces a word with its recording, meaning and tips. */
export function Learn({ ex, tint }: ExerciseProps<'learn'>) {
  const { word } = ex;
  const note = localize(word.note, LANG);
  const exampleMeaning = localize(word.example_meaning, LANG);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View entering={enter.up()} style={styles.hero}>
        <Badge
          tint={tint}
          label={word.kind === 'expression' ? t.lesson.newExpression : t.lesson.new}
          style={styles.center}
        />
        <Text variant="viDisplay" align="center" color={tint.shade}>
          {word.vi}
        </Text>
        {word.audio_url ? (
          <AudioButton key={word.audio_url} uri={word.audio_url} autoPlay size="lg" slow />
        ) : null}
        <Text variant="title" align="center">
          {localize(word.meaning, LANG)}
        </Text>
      </Animated.View>

      {word.north ? (
        <Animated.View entering={enter.up(80)} style={styles.north}>
          <Icon icon={MapPin} size={18} color={colors.textSecondary} />
          <Text color={colors.textSecondary}>
            {t.lesson.north}: <Text variant="bodyBold">{word.north}</Text>
          </Text>
        </Animated.View>
      ) : null}

      {note ? (
        <Animated.View entering={enter.up(140)}>
          <Card tint={{ face: colors.xpSoft, edge: colors.xp }} padding={spacing.md}>
            <View style={styles.row}>
              <Icon icon={Lightbulb} size={20} color={colors.xpShade} />
              <Text style={styles.flex}>{note}</Text>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {word.example_vi ? (
        <Animated.View entering={enter.up(200)}>
          <Card padding={spacing.md}>
            <View style={styles.row}>
              <Icon icon={Quote} size={18} color={tint.solid} />
              <View style={styles.flex}>
                <Text variant="vi">{word.example_vi}</Text>
                {exampleMeaning ? <Text color={colors.textSecondary}>{exampleMeaning}</Text> : null}
              </View>
              {word.example_audio_url ? (
                <AudioButton key={word.example_audio_url} uri={word.example_audio_url} size="sm" />
              ) : null}
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  center: { alignSelf: 'center' },
  north: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
