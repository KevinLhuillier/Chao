import { Dumbbell, Sparkles, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { isCard, isGraded, type Exercise } from '@/lib/session';
import { Button, Icon, ProgressBar, Text, colors, enter, haptics, spacing } from '@/theme';

import { Build } from './Build';
import { Choice } from './Choice';
import { Learn } from './Learn';
import { Match } from './Match';
import { Note } from './Note';
import { TypeAnswer } from './TypeAnswer';
import type { ExerciseProps, Feedback } from './types';

export type SessionResult = {
  /** Graded exercises (first attempts only) and how many were right the first time. */
  graded: number;
  correct: number;
};

type Props = {
  exercises: Exercise[];
  tint: { solid: string; shade: string; soft: string };
  onFinish: (result: SessionResult) => void;
  onQuit: () => void;
};

/**
 * Plays a list of exercises: check → feedback → continue. Missed exercises come
 * back at the end (they don't count twice in the accuracy).
 */
export function LessonPlayer({ exercises, tint, onFinish, onQuit }: Props) {
  const [queue, setQueue] = useState(exercises);
  const [cursor, setCursor] = useState(0);
  const [canCheck, setCanCheck] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const grader = useRef<(() => Feedback) | null>(null);
  const score = useRef<SessionResult>({ graded: 0, correct: 0 });

  const ex = queue[cursor];

  const setAnswer = useCallback((grade: (() => Feedback) | null) => {
    grader.current = grade;
    setCanCheck(!!grade);
  }, []);

  const show = useCallback((f: Feedback) => {
    setFeedback(f);
    if (f.verdict === 'wrong') haptics.error();
    else haptics.success();
  }, []);

  function check() {
    if (grader.current) show(grader.current());
  }

  function next(f: Feedback | null) {
    if (!ex) return;
    let nextQueue = queue;
    if (f && isGraded(ex) && !ex.retry) {
      score.current.graded++;
      if (f.verdict !== 'wrong' && f.firstTry !== false) score.current.correct++;
    }
    if (f?.verdict === 'wrong') {
      nextQueue = [...queue, { ...ex, key: `${ex.key}-retry`, retry: true }];
      setQueue(nextQueue);
    }
    grader.current = null;
    setCanCheck(false);
    setFeedback(null);
    if (cursor + 1 < nextQueue.length) setCursor(cursor + 1);
    else onFinish(score.current);
  }

  const props: Omit<ExerciseProps<'learn'>, 'ex'> = {
    checked: !!feedback,
    setAnswer,
    solve: show,
    tint,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={onQuit}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.lesson.quit}>
          <Icon icon={X} size={28} color={colors.textMuted} />
        </Pressable>
        <ProgressBar progress={cursor / queue.length} color={tint.solid} style={styles.flex} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View key={ex?.key} style={styles.flex}>
          {ex ? (
            ex.kind === 'learn' ? (
              <Learn ex={ex} {...props} />
            ) : ex.kind === 'note' ? (
              <Note ex={ex} {...props} />
            ) : ex.kind === 'choice' ? (
              <Choice ex={ex} {...props} />
            ) : ex.kind === 'type' ? (
              <TypeAnswer ex={ex} {...props} />
            ) : ex.kind === 'match' ? (
              <Match ex={ex} {...props} />
            ) : (
              <Build ex={ex} {...props} />
            )
          ) : null}
        </View>

        {feedback ? (
          <FeedbackPanel feedback={feedback} onContinue={() => next(feedback)} />
        ) : (
          <View style={styles.footer}>
            {ex && isCard(ex) ? (
              <Button
                label={t.common.continue}
                colorOverride={{ face: tint.solid, edge: tint.shade }}
                onPress={() => next(null)}
              />
            ) : ex?.kind === 'match' ? null : (
              <Button
                label={t.lesson.check}
                colorOverride={{ face: tint.solid, edge: tint.shade }}
                disabled={!canCheck}
                onPress={check}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeedbackPanel({ feedback, onContinue }: { feedback: Feedback; onContinue: () => void }) {
  const wrong = feedback.verdict === 'wrong';
  const [title] = useState(() => {
    const i = Math.floor(Math.random() * t.lesson.correct.length);
    return { vi: t.lesson.correct[i]!, sub: t.lesson.correctSub[i]! };
  });
  const fg = wrong ? colors.dangerShade : colors.successShade;

  return (
    <Animated.View
      entering={enter.up()}
      style={[styles.panel, { backgroundColor: wrong ? colors.dangerSoft : colors.successSoft }]}>
      <View style={styles.panelTitle}>
        <Icon icon={wrong ? Dumbbell : Sparkles} size={24} color={fg} />
        <Text variant="heading" color={fg}>
          {wrong ? t.lesson.wrong : title.vi}
        </Text>
        {!wrong ? (
          <Text variant="bodyBold" color={fg} style={styles.sub}>
            {title.sub}
          </Text>
        ) : null}
      </View>
      {feedback.correction ? (
        <View>
          <Text variant="caption" color={fg}>
            {feedback.verdict === 'almost' ? t.lesson.almost : t.lesson.answer}
          </Text>
          <Text variant="vi" color={fg}>
            {feedback.correction}
          </Text>
        </View>
      ) : null}
      <Button
        label={t.common.continue}
        variant={wrong ? 'danger' : 'success'}
        haptic="tap"
        onPress={onContinue}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  footer: { padding: spacing.xl, paddingTop: spacing.md },
  panel: {
    padding: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  panelTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  sub: { opacity: 0.8 },
});
