import { localize } from '@chao/shared';
import { Lock, Play, RotateCcw, Zap } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { LANG, t } from '@/i18n';
import { lessonXp } from '@/lib/gamification';
import type { PathLesson, PathUnit } from '@/lib/types';
import { unitIcon } from '@/lib/unitIcons';
import { Badge, Button, Icon, IconBubble, Text, colors, radii, spacing, unitTint } from '@/theme';

import { Sheet } from './Sheet';

type Props = {
  target: { lesson: PathLesson; unit: PathUnit } | null;
  visible: boolean;
  onStart: (lesson: PathLesson) => void;
  onClose: () => void;
};

/**
 * Shown when a stop is tapped: what the lesson is, what it earns and a button
 * to start (or a hint when it is still locked).
 */
export function LessonSheet({ target, visible, onStart, onClose }: Props) {
  if (!target) return null;
  const { lesson, unit } = target;
  const tint = unitTint(unit.color);
  const locked = lesson.state === 'locked';
  const done = lesson.state === 'done';

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <IconBubble
          icon={locked ? Lock : unitIcon(unit.icon)}
          diameter={64}
          color={locked ? colors.textMuted : tint.shade}
          background={locked ? colors.border : tint.soft}
          style={styles.bubble}
        />
        <View style={styles.titles}>
          <Text variant="caption" color={tint.shade} style={styles.overline}>
            {t.journey.unit(unit.number)} ·{' '}
            {t.journey.lessonOf(lesson.indexInUnit + 1, lesson.unitSize)}
          </Text>
          <Text variant="title">{localize(lesson.title, LANG)}</Text>
          <Text color={colors.textSecondary}>{localize(unit.title, LANG)}</Text>
        </View>
      </View>

      {locked ? (
        <View style={styles.locked}>
          <Icon icon={Lock} size={18} color={colors.textMuted} />
          <Text color={colors.textSecondary} style={styles.flex}>
            {t.journey.locked}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.badges}>
            <Badge icon={Zap} tone="xp" label={t.journey.xpReward(lessonXp(!done, false))} />
            {done ? (
              <Badge tone="lotus" label={t.journey.completed(lesson.completedCount)} />
            ) : null}
          </View>
          <Button
            label={done ? t.journey.practiceAgain : t.journey.start}
            icon={<Icon icon={done ? RotateCcw : Play} size={20} color={colors.textOnColor} />}
            onPress={() => onStart(lesson)}
          />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  bubble: { alignSelf: 'flex-start' },
  titles: { flex: 1, gap: 2 },
  overline: { textTransform: 'uppercase', letterSpacing: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
});
