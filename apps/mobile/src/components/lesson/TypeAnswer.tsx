import { checkMeaning, checkVietnamese, localize } from '@chao/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

import { LANG, t } from '@/i18n';
import { Text, colors, enter, radii, spacing, typography } from '@/theme';

import { Prompt } from './Prompt';
import type { ExerciseProps } from './types';

/** Write the answer: the translation, the Vietnamese, or what was heard (dictation). */
export function TypeAnswer({ ex, checked, setAnswer, tint }: ExerciseProps<'type'>) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const { word, mode } = ex;
  const toVi = mode !== 'meaning';

  function change(text: string) {
    setValue(text);
    if (!text.trim()) {
      setAnswer(null);
      return;
    }
    setAnswer(() => {
      const verdict = (toVi ? checkVietnamese : checkMeaning)(text, ex.accepted);
      return verdict === 'correct' ? { verdict } : { verdict, correction: ex.accepted[0] };
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {mode === 'meaning' ? (
        <Prompt
          instruction={t.lesson.typeMeaning}
          text={word.vi}
          vi
          audio={word.audio_url}
          tint={tint}
        />
      ) : mode === 'vi' ? (
        <Prompt instruction={t.lesson.typeVi} text={localize(word.meaning, LANG)} tint={tint} />
      ) : (
        <Prompt instruction={t.lesson.listenType} audio={word.audio_url} listen tint={tint} />
      )}
      <Animated.View entering={enter.up(100)} style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={change}
          editable={!checked}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholder={toVi ? t.lesson.typeHereVi : t.lesson.typeHere}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            toVi ? typography.vi : typography.bodyBold,
            { borderColor: focused ? tint.solid : colors.border },
          ]}
          multiline
          blurOnSubmit
          returnKeyType="done"
        />
        {toVi ? (
          <Text variant="caption" color={colors.textMuted}>
            {t.lesson.toneHint}
          </Text>
        ) : null}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  inputWrap: { gap: spacing.sm },
  input: {
    minHeight: 120,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
    fontSize: 20,
  },
});
