/**
 * Loads the starter course (server/course.ts) into Supabase.
 *
 *   npm run seed            add what is missing, keep everything already there
 *   npm run seed -- --force overwrite the seeded units, lessons, words and activities
 *
 * Rows are matched by `key`, so running it twice changes nothing. Recordings
 * uploaded from the admin are always kept.
 */
import { generateActivities, slugify, type WordRow } from '@chao/shared';

import { COURSE } from './course.js';
import { adminClient } from './db.js';

const force = process.argv.includes('--force');
const db = adminClient();

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

const WORD_COLUMNS =
  'id, key, unit_id, vi, meaning, alternatives, kind, north, note, example_vi, example_meaning, audio_url, example_audio_url';

async function upsert<T>(table: string, rows: object[], columns: string): Promise<T[]> {
  if (!rows.length) return [];
  // Without --force, existing rows are left untouched (ignoreDuplicates).
  check(
    await db.from(table).upsert(rows, { onConflict: 'key', ignoreDuplicates: !force }),
    `Upsert ${table}`,
  );
  const keys = rows.map((r) => (r as { key: string }).key);
  return check(await db.from(table).select(columns).in('key', keys), `Read ${table}`) as T[];
}

const units = await upsert<{ id: string; key: string }>(
  'units',
  COURSE.map((u, position) => ({
    key: u.key,
    position,
    title: { en: u.title },
    description: { en: u.description },
    color: u.color,
    icon: u.icon,
    published: true,
  })),
  'id, key',
);
const unitId = new Map(units.map((u) => [u.key, u.id]));

const lessons = await upsert<{ id: string; key: string }>(
  'lessons',
  COURSE.flatMap((u) =>
    u.lessons.map((l, position) => ({
      key: l.key,
      unit_id: unitId.get(u.key)!,
      position,
      title: { en: l.title },
      published: true,
    })),
  ),
  'id, key',
);
const lessonId = new Map(lessons.map((l) => [l.key, l.id]));

// Same spelling can exist in two themes ("ba" = dad / three): keys include the unit.
const wordKey = (unit: string, vi: string) => `${unit}-${slugify(vi)}`;

const words = await upsert<WordRow>(
  'words',
  COURSE.flatMap((u) =>
    u.lessons.flatMap((l) =>
      l.words.map((w) => ({
        key: wordKey(u.key, w.vi),
        unit_id: unitId.get(u.key)!,
        vi: w.vi.normalize('NFC'),
        meaning: { en: w.en },
        alternatives: w.alt?.length ? { en: w.alt } : {},
        kind: w.kind ?? 'word',
        north: w.north ?? null,
        note: w.note ? { en: w.note } : {},
        example_vi: w.ex?.[0] ?? null,
        example_meaning: w.ex ? { en: w.ex[1] } : {},
      })),
    ),
  ),
  WORD_COLUMNS,
);
const wordByKey = new Map(words.map((w) => [w.key, w]));

let filled = 0;
for (const u of COURSE) {
  for (const l of u.lessons) {
    const id = lessonId.get(l.key)!;
    const existing = check(
      await db.from('activities').select('id').eq('lesson_id', id),
      'Read activities',
    ) as unknown[];
    if (existing.length && !force) continue;

    const lessonWords = l.words.map((w) => wordByKey.get(wordKey(u.key, w.vi))!);
    check(await db.from('lesson_words').delete().eq('lesson_id', id), 'Reset lesson words');
    check(
      await db
        .from('lesson_words')
        .insert(lessonWords.map((w, position) => ({ lesson_id: id, word_id: w.id, position }))),
      'Insert lesson words',
    );
    check(await db.from('activities').delete().eq('lesson_id', id), 'Reset activities');
    check(
      await db.from('activities').insert(
        generateActivities(lessonWords).map((a, position) => ({
          lesson_id: id,
          position,
          type: a.type,
          data: a.data,
        })),
      ),
      'Insert activities',
    );
    filled++;
  }
}

console.log(
  `✓ ${units.length} units, ${lessons.length} lessons, ${words.length} words` +
    ` — activities generated for ${filled} lesson(s)${force ? ' (forced)' : ''}.`,
);
