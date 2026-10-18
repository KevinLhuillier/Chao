import type { LessonRow, UnitRow, WordRow } from '@chao/shared';

export type { ActivityPayload, ActivityRow, LessonRow, UnitRow, WordRow } from '@chao/shared';

export type UserStats = {
  total_xp: number;
  current_streak: number;
  best_streak: number;
  last_active_date: string | null;
  daily_goal_xp: number;
};

export type Profile = { username: string; ui_lang: string };

export type LessonState = 'done' | 'current' | 'locked';

/** A lesson as placed on the river. */
export type PathLesson = LessonRow & {
  state: LessonState;
  /** Index on the whole path (0-based). */
  index: number;
  /** Index within its unit (0-based) and the unit's lesson count. */
  indexInUnit: number;
  unitSize: number;
  completedCount: number;
};

export type PathUnit = UnitRow & { number: number; lessons: PathLesson[] };

/** A learned word, for the vocabulary page. */
export type LearnedWord = WordRow;
