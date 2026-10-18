import { localize } from '@chao/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonPlayer, type SessionResult } from '@/components/lesson/LessonPlayer';
import { BoatArt } from '@/components/river/Boat';
import { LANG, t } from '@/i18n';
import { completeLesson, fetchLesson, type LessonBundle } from '@/lib/api/course';
import { lessonXp } from '@/lib/gamification';
import { buildExercises, type Exercise } from '@/lib/session';
import { useStats } from '@/lib/stats';
import { Button, Text, colors, spacing, unitTint } from '@/theme';

/** Plays one lesson of the river, then records it and awards XP. */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { award } = useStats();
  const [bundle, setBundle] = useState<LessonBundle | null>(null);
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    fetchLesson(id)
      .then((b) => {
        setBundle(b);
        setExercises(buildExercises(b.activities, b.words, LANG));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  async function finish({ graded, correct }: SessionResult) {
    setFinishing(true);
    const accuracy = graded ? Math.round((correct / graded) * 100) : 100;
    const perfect = graded > 0 && correct === graded;
    let firstTime = false;
    try {
      firstTime = await completeLesson(id, accuracy);
    } catch (e) {
      console.warn('completeLesson', e);
    }
    const xp = lessonXp(firstTime, perfect);
    await award('lesson', xp);
    router.replace({
      pathname: '/celebration',
      params: {
        kind: perfect ? 'perfect' : 'lesson',
        xp: String(xp),
        accuracy: String(accuracy),
        title: bundle ? localize(bundle.lesson.title, LANG) : '',
        color: bundle?.unit.color ?? 'jade',
      },
    });
  }

  if (error || !exercises || !bundle || finishing) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {error ? (
          <View style={styles.box}>
            <Text color={colors.danger}>{t.common.loadError(error)}</Text>
            <Button label={t.common.back} variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={styles.box}>
            <BoatArt />
            <ActivityIndicator color={colors.primary} />
            <Text align="center" color={colors.textSecondary}>
              {t.lesson.loading}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (!exercises.length) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <View style={styles.box}>
          <BoatArt />
          <Text align="center" color={colors.textSecondary}>
            {t.lesson.empty}
          </Text>
          <Button label={t.common.back} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      tint={unitTint(bundle.unit.color)}
      onFinish={finish}
      onQuit={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center', maxWidth: 420 },
});
