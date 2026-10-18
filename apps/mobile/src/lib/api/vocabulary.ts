import type { UnitRow, WordRow } from '@chao/shared';

import { supabase, unwrap } from '../supabase';
import { WORD_COLUMNS } from './course';

export type Theme = { unit: UnitRow; words: WordRow[]; unlocked: boolean };

/**
 * The learner's vocabulary, grouped by theme (unit): the words taught by the
 * lessons they completed. Themes without any learned word are listed as locked.
 */
export async function fetchLearnedVocabulary(): Promise<Theme[]> {
  const [unitsRes, progressRes] = await Promise.all([
    supabase
      .from('units')
      .select('id, key, position, title, description, color, icon, published')
      .order('position'),
    supabase.from('user_lesson_progress').select('lesson_id'),
  ]);
  const units = unwrap(unitsRes) as UnitRow[];
  const lessonIds = (unwrap(progressRes) as { lesson_id: string }[]).map((p) => p.lesson_id);

  const learned = new Map<string, WordRow>();
  if (lessonIds.length) {
    const rows = unwrap(
      await supabase
        .from('lesson_words')
        .select(`position, words(${WORD_COLUMNS})`)
        .in('lesson_id', lessonIds)
        .order('position'),
    ) as unknown as { words: WordRow | null }[];
    for (const r of rows) if (r.words) learned.set(r.words.id, r.words);
  }

  const byUnit = new Map<string, WordRow[]>();
  for (const w of learned.values()) {
    const key = w.unit_id ?? '';
    byUnit.set(key, [...(byUnit.get(key) ?? []), w]);
  }
  return units.map((unit) => {
    const words = byUnit.get(unit.id) ?? [];
    return { unit, words, unlocked: words.length > 0 };
  });
}
