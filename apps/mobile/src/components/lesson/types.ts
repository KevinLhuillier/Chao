import type { Verdict } from '@chao/shared';

import type { Exercise } from '@/lib/session';

export type Feedback = {
  verdict: Verdict;
  /** Proper answer, shown when the learner was wrong or almost right. */
  correction?: string;
  /** False when the exercise was solved after mistakes (pairs): no retry, but not "first try". */
  firstTry?: boolean;
};

export type ExerciseProps<K extends Exercise['kind']> = {
  ex: Extract<Exercise, { kind: K }>;
  /** True once the answer was checked: inputs freeze, tiles show right/wrong. */
  checked: boolean;
  /** Registers how to grade the current answer (null: nothing to check yet). */
  setAnswer: (grade: (() => Feedback) | null) => void;
  /** For exercises that grade themselves (pairs). */
  solve: (feedback: Feedback) => void;
  tint: { solid: string; shade: string; soft: string };
};
