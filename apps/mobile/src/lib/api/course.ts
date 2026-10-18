import type { ActivityRow, LessonRow, UnitRow, WordRow } from '@chao/shared';

import { currentUserId, supabase, unwrap } from '../supabase';
import type { LessonState, PathLesson, PathUnit } from '../types';

const UNIT_COLUMNS = 'id, key, position, title, description, color, icon, published';
const LESSON_COLUMNS = 'id, unit_id, key, position, title, published';
export const WORD_COLUMNS =
  'id, key, unit_id, vi, meaning, alternatives, kind, north, note, example_vi, example_meaning, audio_url, example_audio_url';

type RawUnit = UnitRow & { lessons: LessonRow[] };

/**
 * The whole river: published units and lessons in order, each lesson with its
 * state. The path is linear: the first lesson not completed yet is the current
 * one, everything after it is locked.
 */
export async function fetchPath(): Promise<PathUnit[]> {
  const [units, progress] = await Promise.all([
    supabase
      .from('units')
      .select(`${UNIT_COLUMNS}, lessons(${LESSON_COLUMNS})`)
      .order('position')
      .order('position', { referencedTable: 'lessons' }),
    supabase.from('user_lesson_progress').select('lesson_id, completed_count'),
  ]);
  const rows = unwrap(units) as unknown as RawUnit[];
  const done = new Map(
    (unwrap(progress) as { lesson_id: string; completed_count: number }[]).map((p) => [
      p.lesson_id,
      p.completed_count,
    ]),
  );

  let index = 0;
  let currentFound = false;
  return rows
    .filter((u) => u.lessons.length)
    .map(({ lessons, ...unit }, u) => ({
      ...unit,
      number: u + 1,
      lessons: lessons.map((lesson, i): PathLesson => {
        let state: LessonState = 'locked';
        if (!currentFound) {
          if (done.has(lesson.id)) state = 'done';
          else {
            state = 'current';
            currentFound = true;
          }
        }
        return {
          ...lesson,
          state,
          index: index++,
          indexInUnit: i,
          unitSize: lessons.length,
          completedCount: done.get(lesson.id) ?? 0,
        };
      }),
    }));
}

/** Every word of the course, kept for the session: lookups and wrong options. */
let wordCache: { at: number; words: WordRow[] } | null = null;
const WORD_CACHE_MS = 5 * 60_000;

export async function fetchAllWords(): Promise<WordRow[]> {
  if (wordCache && Date.now() - wordCache.at < WORD_CACHE_MS) return wordCache.words;
  const words = unwrap(
    await supabase.from('words').select(WORD_COLUMNS).order('vi').limit(5000),
  ) as WordRow[];
  wordCache = { at: Date.now(), words };
  return words;
}

export type LessonBundle = {
  lesson: LessonRow;
  unit: UnitRow;
  activities: ActivityRow[];
  /** Every word of the course (activities refer to them by id). */
  words: WordRow[];
};

export async function fetchLesson(lessonId: string): Promise<LessonBundle> {
  const [lessonRes, activitiesRes, words] = await Promise.all([
    supabase
      .from('lessons')
      .select(`${LESSON_COLUMNS}, units(${UNIT_COLUMNS})`)
      .eq('id', lessonId)
      .single(),
    supabase
      .from('activities')
      .select('id, lesson_id, position, type, data')
      .eq('lesson_id', lessonId)
      .order('position'),
    fetchAllWords(),
  ]);
  const { units, ...lesson } = unwrap(lessonRes) as unknown as LessonRow & { units: UnitRow };
  return {
    lesson,
    unit: units,
    activities: unwrap(activitiesRes) as ActivityRow[],
    words,
  };
}

/**
 * Records a finished lesson (count + best accuracy).
 * Returns true the first time, which earns the full XP.
 */
export async function completeLesson(lessonId: string, accuracy: number): Promise<boolean> {
  const userId = await currentUserId();
  const existing = unwrap(
    await supabase
      .from('user_lesson_progress')
      .select('completed_count, best_accuracy')
      .eq('lesson_id', lessonId)
      .maybeSingle(),
  ) as { completed_count: number; best_accuracy: number } | null;

  const now = new Date().toISOString();
  unwrap(
    await supabase.from('user_lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed_count: (existing?.completed_count ?? 0) + 1,
        best_accuracy: Math.max(existing?.best_accuracy ?? 0, accuracy),
        last_completed_at: now,
        ...(existing ? {} : { first_completed_at: now }),
      },
      { onConflict: 'user_id,lesson_id' },
    ),
  );
  return !existing;
}
