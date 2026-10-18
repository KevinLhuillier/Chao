import { localize } from '@chao/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { LANG, t } from '@/i18n';
import { enter, spacing } from '@/theme';

import { Prompt } from './Prompt';
import { Tile, type TileState } from './Tile';
import type { ExerciseProps } from './types';

/** Multiple choice: meaning of a word, Vietnamese for a meaning, or what was heard. */
export function Choice({ ex, checked, setAnswer, tint }: ExerciseProps<'choice'>) {
  const [picked, setPicked] = useState<string | null>(null);
  const { word, mode } = ex;
  const viOptions = mode !== 'meaning';

  function pick(option: string) {
    if (checked) return;
    setPicked(option);
    setAnswer(() =>
      option === ex.answer ? { verdict: 'correct' } : { verdict: 'wrong', correction: ex.answer },
    );
  }

  const stateOf = (option: string): TileState => {
    if (!checked) return option === picked ? 'selected' : 'idle';
    if (option === ex.answer) return 'right';
    return option === picked ? 'wrong' : 'dim';
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {mode === 'meaning' ? (
        <Prompt
          instruction={t.lesson.whatMeans}
          text={word.vi}
          vi
          audio={word.audio_url}
          tint={tint}
        />
      ) : mode === 'vi' ? (
        <Prompt instruction={t.lesson.howToSay(localize(word.meaning, LANG))} tint={tint} />
      ) : (
        <Prompt instruction={t.lesson.listenPick} audio={word.audio_url} listen tint={tint} />
      )}
      <View style={styles.options}>
        {ex.options.map((option, i) => (
          <Animated.View key={option} entering={enter.up(80 + i * 50)}>
            <Tile
              label={option}
              vi={viOptions}
              state={stateOf(option)}
              onPress={() => pick(option)}
            />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  options: { gap: spacing.md },
});
