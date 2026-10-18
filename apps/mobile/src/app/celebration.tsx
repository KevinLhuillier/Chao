import { router, useLocalSearchParams } from 'expo-router';
import { Flame, Target, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import { BoatArt } from '@/components/river/Boat';
import { Lantern } from '@/components/river/Lantern';
import { t } from '@/i18n';
import { displayedStreak } from '@/lib/gamification';
import { useStats } from '@/lib/stats';
import {
  Badge,
  Button,
  Card,
  Icon,
  ProgressBar,
  Text,
  colors,
  enter,
  haptics,
  palette,
  radii,
  river,
  spacing,
  unitTint,
} from '@/theme';

type Kind = 'lesson' | 'perfect' | 'practice';

type Params = { kind?: Kind; xp?: string; title?: string; accuracy?: string; color?: string };

const HEADLINES: Record<Kind, string> = {
  lesson: t.celebration.lesson,
  perfect: t.celebration.perfect,
  practice: t.celebration.practice,
};

/** Reward screen after a lesson or a practice session. */
export default function Celebration() {
  const {
    kind = 'lesson',
    xp = '0',
    title,
    accuracy,
    color = 'jade',
  } = useLocalSearchParams<Params>();
  const { stats, todayXp } = useStats();
  const gained = Number(xp) || 0;
  const shownXp = useCountUp(gained);
  const tint = unitTint(color);

  useEffect(() => {
    haptics.success();
  }, []);

  const goal = stats?.daily_goal_xp ?? 30;
  const reached = todayXp >= goal;
  const streak = stats ? displayedStreak(stats) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Confetti />
      <View style={styles.content}>
        <Animated.View entering={enter.up()} style={styles.hero}>
          <Lantern style={styles.lanternLeft} />
          <Lantern
            style={styles.lanternRight}
            color={palette.gold}
            shade={palette.goldShade}
            delay={500}
          />
          <SailingBoat />
        </Animated.View>

        <Animated.View entering={enter.up(120)} style={styles.titles}>
          <Text variant="display" align="center" color={tint.shade}>
            {HEADLINES[kind]}
          </Text>
          {title ? (
            <Text variant="heading" align="center" color={colors.textSecondary}>
              {title}
            </Text>
          ) : null}
          {accuracy ? (
            <Text align="center" color={colors.textSecondary}>
              {t.celebration.accuracy(Number(accuracy))}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={enter.up(240)}>
          <Card tint={{ face: colors.xpSoft, edge: colors.xp }} padding={spacing.xl}>
            <View style={styles.xpRow}>
              <Icon icon={Zap} size={36} color={colors.xpShade} />
              <Text variant="display" color={colors.xpShade}>
                +{shownXp} XP
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={enter.up(360)} style={styles.stats}>
          <View style={styles.row}>
            <Badge icon={Flame} label={t.celebration.streak(streak)} tone="streak" />
            <Badge icon={Zap} label={`${stats?.total_xp ?? 0} XP`} tone="xp" />
          </View>
          <Card>
            <View style={styles.goalTitle}>
              <Icon
                icon={Target}
                size={18}
                color={reached ? colors.successShade : colors.xpShade}
              />
              <Text variant="bodyBold">
                {reached
                  ? t.celebration.goalReached
                  : t.celebration.goal(Math.min(todayXp, goal), goal)}
              </Text>
            </View>
            <ProgressBar progress={todayXp / goal} color={reached ? colors.success : colors.xp} />
          </Card>
        </Animated.View>
      </View>

      <Animated.View entering={enter.up(480)} style={styles.footer}>
        <Button
          label={t.common.continue}
          colorOverride={{ face: tint.solid, edge: tint.shade }}
          onPress={() => router.back()}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

/** The boat sailing on a strip of river. */
function SailingBoat() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [p]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 + p.value * 8 }, { rotate: `${-3 + p.value * 6}deg` }],
  }));
  return (
    <View style={styles.water}>
      <Animated.View style={[styles.boat, style]}>
        <BoatArt />
      </Animated.View>
    </View>
  );
}

/** Animates a number from 0 to `target` (~0.9 s). */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return value;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  hero: { alignItems: 'center', height: 150, justifyContent: 'flex-end' },
  lanternLeft: { position: 'absolute', left: '14%', top: 0 },
  lanternRight: { position: 'absolute', right: '14%', top: 0 },
  water: {
    width: 240,
    height: 70,
    borderRadius: radii.pill,
    backgroundColor: river.water,
    borderBottomWidth: 6,
    borderBottomColor: river.waterDeep,
    alignItems: 'center',
  },
  boat: { marginTop: -46 },
  titles: { gap: spacing.sm },
  xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  stats: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  goalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: { padding: spacing.xl, gap: spacing.md },
});
