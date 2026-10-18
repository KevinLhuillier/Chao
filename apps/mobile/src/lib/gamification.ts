/**
 * XP, streak and daily goal — the single place where gamification rules live.
 * Tweak the constants below to rebalance the game.
 */
import { daysBetween, localDateString } from './dates';
import { currentUserId, supabase, unwrap } from './supabase';
import type { UserStats } from './types';

export type XpSource = 'lesson' | 'practice';

/** XP amounts. */
export const XP_RULES = {
  /** Finishing a lesson for the first time. */
  lessonFirstCompletion: 15,
  /** Finishing a lesson already completed before (replay). */
  lessonReplay: 5,
  /** Bonus when every answer was right on the first try. */
  perfectBonus: 5,
  /** Each first-try correct answer in a practice session. */
  practiceCorrectAnswer: 1,
  /** Bonus for completing a practice session. */
  practiceSessionBonus: 5,
} as const;

export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 30;

/** XP earned for a finished lesson. */
export function lessonXp(firstTime: boolean, perfect: boolean) {
  return (
    (firstTime ? XP_RULES.lessonFirstCompletion : XP_RULES.lessonReplay) +
    (perfect ? XP_RULES.perfectBonus : 0)
  );
}

/**
 * Streak rule: a day counts as soon as the user earns any XP.
 * Same day → unchanged; the day after the last active day → +1; later → reset to 1.
 */
export function nextStreak(
  stats: Pick<UserStats, 'current_streak' | 'best_streak' | 'last_active_date'>,
  today: string,
) {
  const gap = stats.last_active_date ? daysBetween(stats.last_active_date, today) : Infinity;
  const current = gap === 0 ? stats.current_streak : gap === 1 ? stats.current_streak + 1 : 1;
  return { current, best: Math.max(stats.best_streak, current), lastActive: today };
}

/** Streak to display: it is only "alive" if the user was active today or yesterday. */
export function displayedStreak(stats: UserStats, today = localDateString()): number {
  if (!stats.last_active_date) return 0;
  return daysBetween(stats.last_active_date, today) <= 1 ? stats.current_streak : 0;
}

export type AwardResult = {
  stats: UserStats;
  todayXp: number;
  gained: number;
  /** True only on the award that crossed the daily goal. */
  goalJustReached: boolean;
  /** True when this award extended the streak (first XP of the day). */
  streakExtended: boolean;
};

const STATS_COLUMNS = 'total_xp, current_streak, best_streak, last_active_date, daily_goal_xp';

export async function fetchStats(): Promise<UserStats> {
  const userId = await currentUserId();
  const existing = unwrap(
    await supabase.from('user_stats').select(STATS_COLUMNS).eq('user_id', userId).maybeSingle(),
  );
  if (existing) return existing as UserStats;
  // The signup trigger normally creates the row; this is a safety net.
  return unwrap(
    await supabase.from('user_stats').insert({ user_id: userId }).select(STATS_COLUMNS).single(),
  ) as UserStats;
}

export async function fetchTodayXp(today = localDateString()): Promise<number> {
  const rows = unwrap(
    await supabase.from('xp_events').select('amount').eq('local_date', today),
  ) as { amount: number }[];
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Records an XP event and updates totals + streak.
 * Two writes (event, then stats): not atomic, but a failure in between only
 * leaves an extra history row — acceptable for a single-player game.
 */
export async function awardXp(source: XpSource, amount: number): Promise<AwardResult> {
  const userId = await currentUserId();
  const today = localDateString();
  const [before, todayBefore] = await Promise.all([fetchStats(), fetchTodayXp(today)]);

  unwrap(
    await supabase.from('xp_events').insert({ user_id: userId, source, amount, local_date: today }),
  );

  const streak = nextStreak(before, today);
  const stats = unwrap(
    await supabase
      .from('user_stats')
      .update({
        total_xp: before.total_xp + amount,
        current_streak: streak.current,
        best_streak: streak.best,
        last_active_date: streak.lastActive,
      })
      .eq('user_id', userId)
      .select(STATS_COLUMNS)
      .single(),
  ) as UserStats;

  const todayXp = todayBefore + amount;
  return {
    stats,
    todayXp,
    gained: amount,
    goalJustReached: todayBefore < before.daily_goal_xp && todayXp >= before.daily_goal_xp,
    streakExtended: before.last_active_date !== today,
  };
}

export async function setDailyGoal(goal: number): Promise<UserStats> {
  const userId = await currentUserId();
  return unwrap(
    await supabase
      .from('user_stats')
      .update({ daily_goal_xp: goal })
      .eq('user_id', userId)
      .select(STATS_COLUMNS)
      .single(),
  ) as UserStats;
}
