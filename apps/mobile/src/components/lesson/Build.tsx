import { normalizeAnswer } from '@chao/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { t } from '@/i18n';
import { colors, enter, spacing } from '@/theme';

import { Prompt } from './Prompt';
import { Tile } from './Tile';
import type { ExerciseProps } from './types';

/** Rebuild a sentence by tapping its words in order. */
export function Build({ ex, checked, setAnswer, tint }: ExerciseProps<'build'>) {
  /** Indexes into ex.tiles, in answer order. */
  const [chosen, setChosen] = useState<number[]>([]);
  const toVi = ex.mode === 'vi';

  function update(next: number[]) {
    setChosen(next);
    if (!next.length) {
      setAnswer(null);
      return;
    }
    const answer = normalizeAnswer(next.map((i) => ex.tiles[i]).join(' '));
    const ok = ex.accepted.some((a) => normalizeAnswer(a) === answer);
    setAnswer(() => (ok ? { verdict: 'correct' } : { verdict: 'wrong', correction: ex.answer }));
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Prompt
        instruction={toVi ? t.lesson.buildVi : t.lesson.buildMeaning}
        text={ex.prompt}
        vi={!toVi}
        audio={ex.audio}
        tint={tint}
      />

      <View style={styles.answer}>
        {chosen.map((i) => (
          <Animated.View key={i} layout={LinearTransition.duration(180)} entering={enter.fade()}>
            <Tile
              label={ex.tiles[i]!}
              vi={toVi}
              compact
              disabled={checked}
              onPress={() => update(chosen.filter((c) => c !== i))}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.bank}>
        {ex.tiles.map((tile, i) => (
          <Tile
            key={i}
            label={tile}
            vi={toVi}
            compact
            state={chosen.includes(i) ? 'used' : 'idle'}
            disabled={checked}
            onPress={() => update([...chosen, i])}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  // Ruled lines, like a school notebook.
  answer: {
    minHeight: 124,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
  },
  bank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
