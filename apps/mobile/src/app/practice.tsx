import { generateActivities, shuffle } from '@chao/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonPlayer, type SessionResult } from '@/components/lesson/LessonPlayer';
import { LANG, t } from '@/i18n';
import { fetchAllWords } from '@/lib/api/course';
import { fetchLearnedVocabulary } from '@/lib/api/vocabulary';
import { XP_RULES } from '@/lib/gamification';
import { buildExercises, type Exercise } from '@/lib/session';
import { useStats } from '@/lib/stats';
import { Button, Text, colors, spacing, unitTint } from '@/theme';

const PRACTICE_WORDS = 6;

/**
 * Free practice on learned words (all themes, or the one passed as `unit`):
 * quizzes both ways, pairs and typing, no lesson cards.
 */
export default function Practice() {
  const { unit } = useLocalSearchParams<{ unit?: string }>();
  const { award } = useStats();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [color, setColor] = useState('jade');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchLearnedVocabulary(), fetchAllWords()])
      .then(([themes, pool]) => {
        const chosen = unit ? themes.filter((th) => th.unit.id === unit) : themes;
        if (unit && chosen[0]) setColor(chosen[0].unit.color);
        const words = shuffle(chosen.flatMap((th) => th.words)).slice(0, PRACTICE_WORDS);
        const activities = generateActivities(words, { teach: false });
        setExercises(buildExercises(shuffle(activities).slice(0, 14), pool, LANG));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [unit]);

  async function finish({ graded, correct }: SessionResult) {
    const xp = correct * XP_RULES.practiceCorrectAnswer + XP_RULES.practiceSessionBonus;
    await award('practice', xp);
    router.replace({
      pathname: '/celebration',
      params: {
        kind: 'practice',
        xp: String(xp),
        accuracy: String(graded ? Math.round((correct / graded) * 100) : 100),
        color,
      },
    });
  }

  if (error || !exercises) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {error ? (
          <View style={styles.box}>
            <Text color={colors.danger}>{t.common.loadError(error)}</Text>
            <Button label={t.common.back} variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  if (exercises.length < 3) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <View style={styles.box}>
          <Text align="center" color={colors.textSecondary}>
            {t.words.notEnough}
          </Text>
          <Button label={t.common.back} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      tint={unitTint(color)}
      onFinish={finish}
      onQuit={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { padding: spacing.xl, gap: spacing.lg, alignItems: 'stretch', maxWidth: 420 },
});
