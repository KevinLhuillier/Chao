import { Flame, Target, Zap } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { displayedStreak } from '@/lib/gamification';
import { useStats } from '@/lib/stats';
import { Badge, Icon, ProgressBar, Text, colors, radii, spacing } from '@/theme';

import { Logo } from './Logo';

/** Top bar of the journey: logo, streak, total XP and today's goal. */
export function StatsBar() {
  const { stats, todayXp } = useStats();
  const streak = stats ? displayedStreak(stats) : 0;
  const goal = stats?.daily_goal_xp ?? 30;
  const reached = todayXp >= goal;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Logo size={30} />
        <View style={styles.spacer} />
        <Badge icon={Flame} label={streak} tone="streak" />
        <Badge icon={Zap} label={`${stats?.total_xp ?? 0} XP`} tone="xp" />
      </View>
      <View style={styles.goal}>
        <Icon icon={Target} size={18} color={reached ? colors.successShade : colors.xpShade} />
        <Text variant="caption" color={colors.textSecondary}>
          {reached ? t.stats.goalReached : t.stats.goal}
        </Text>
        <ProgressBar
          progress={todayXp / goal}
          color={reached ? colors.success : colors.xp}
          height={12}
          style={styles.bar}
        />
        <Text variant="caption" color={colors.textSecondary}>
          {t.stats.xpOf(Math.min(todayXp, goal), goal)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spacer: { flex: 1 },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  bar: { flex: 1, width: undefined },
});
