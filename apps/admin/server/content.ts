/**
 * The course in Supabase (the source of truth): units, lessons, words,
 * activities and recordings. Everything goes through the service key.
 */
import {
  ACTIVITY_TYPES,
  UNIT_COLORS,
  UNIT_ICONS,
  slugify,
  type ActivityPayload,
  type LessonRow,
  type UnitRow,
  type WordRow,
} from '@chao/shared';
import { randomBytes } from 'node:crypto';

import type {
  ActivityDraft,
  CourseUnit,
  LessonDetail,
  LessonInput,
  LessonSummary,
  UnitInput,
  WordInput,
} from '../shared/api.js';
import { HttpError, check, requireDb } from './db.js';

const UNIT_COLUMNS = 'id, key, position, title, description, color, icon, published';
const LESSON_COLUMNS = 'id, unit_id, key, position, title, published';
const WORD_COLUMNS =
  'id, key, unit_id, vi, meaning, alternatives, kind, north, note, example_vi, example_meaning, audio_url, example_audio_url';

/** Stable, readable key: "greetings-3f9a". */
const newKey = (label: string) => `${slugify(label) || 'item'}-${randomBytes(2).toString('hex')}`;

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

function cleanLocalized(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>)
      .map(([lang, s]) => [lang, text(s)] as const)
      .filter((e): e is [string, string] => !!e[1]),
  );
}

function cleanList(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>)
      .map(([lang, list]): [string, string[]] => [
        lang,
        (Array.isArray(list) ? list : []).map(text).filter((s): s is string => !!s),
      ])
      .filter(([, list]) => list.length),
  );
}

// ---------------------------------------------------------------------------
// Course (units + lessons)
// ---------------------------------------------------------------------------

type RawLesson = LessonRow & { lesson_words: { count: number }[]; activities: { count: number }[] };
type RawUnit = UnitRow & { lessons: RawLesson[]; words: { count: number }[] };

export async function getCourse(): Promise<CourseUnit[]> {
  const rows = check(
    await requireDb()
      .from('units')
      .select(
        `${UNIT_COLUMNS}, words(count), lessons(${LESSON_COLUMNS}, lesson_words(count), activities(count))`,
      )
      .order('position')
      .order('position', { referencedTable: 'lessons' }),
    'Lecture du parcours',
  ) as unknown as RawUnit[];
  return rows.map(({ lessons, words, ...unit }) => ({
    ...unit,
    word_count: words[0]?.count ?? 0,
    lessons: lessons.map(({ lesson_words, activities, ...lesson }): LessonSummary => ({
      ...lesson,
      word_count: lesson_words[0]?.count ?? 0,
      activity_count: activities[0]?.count ?? 0,
    })),
  }));
}

function cleanUnit(input: Partial<UnitInput>) {
  const out: Record<string, unknown> = {};
  if (input.title !== undefined) out.title = cleanLocalized(input.title);
  if (input.description !== undefined) out.description = cleanLocalized(input.description);
  if (input.color !== undefined) {
    if (!UNIT_COLORS.includes(input.color)) throw new HttpError(400, 'Couleur invalide.');
    out.color = input.color;
  }
  if (input.icon !== undefined) {
    if (!UNIT_ICONS.includes(input.icon)) throw new HttpError(400, 'Icône invalide.');
    out.icon = input.icon;
  }
  if (input.published !== undefined) out.published = !!input.published;
  return out;
}

export async function createUnit(input: UnitInput): Promise<UnitRow> {
  const client = requireDb();
  const values = cleanUnit(input);
  const title = (values.title as Record<string, string>).en;
  if (!title) throw new HttpError(400, 'Le titre (anglais) est obligatoire.');
  const last = check(
    await client.from('units').select('position').order('position', { ascending: false }).limit(1),
    'Lecture des unités',
  ) as { position: number }[];
  return check(
    await client
      .from('units')
      .insert({ ...values, key: newKey(title), position: (last[0]?.position ?? -1) + 1 })
      .select(UNIT_COLUMNS)
      .single(),
    'Création de l’unité',
  ) as UnitRow;
}

export async function updateUnit(id: string, input: Partial<UnitInput>): Promise<UnitRow> {
  return check(
    await requireDb()
      .from('units')
      .update(cleanUnit(input))
      .eq('id', id)
      .select(UNIT_COLUMNS)
      .single(),
    'Mise à jour de l’unité',
  ) as UnitRow;
}

/** Deletes the unit and its lessons (learners' progress on them goes too). Words are kept. */
export async function deleteUnit(id: string) {
  check(await requireDb().from('units').delete().eq('id', id), 'Suppression de l’unité');
}

/** Saves an order: `ids` in their new order. */
async function reorder(table: 'units' | 'lessons', ids: string[]) {
  const client = requireDb();
  await Promise.all(
    ids.map(async (id, position) =>
      check(await client.from(table).update({ position }).eq('id', id), 'Réordonnancement'),
    ),
  );
}

export const reorderUnits = (ids: string[]) => reorder('units', ids);
export const reorderLessons = (ids: string[]) => reorder('lessons', ids);

export async function createLesson(unitId: string, title: string): Promise<LessonRow> {
  const client = requireDb();
  const name = title.trim();
  if (!name) throw new HttpError(400, 'Le titre est obligatoire.');
  const last = check(
    await client
      .from('lessons')
      .select('position')
      .eq('unit_id', unitId)
      .order('position', { ascending: false })
      .limit(1),
    'Lecture des leçons',
  ) as { position: number }[];
  return check(
    await client
      .from('lessons')
      .insert({
        unit_id: unitId,
        key: newKey(name),
        title: { en: name },
        position: (last[0]?.position ?? -1) + 1,
      })
      .select(LESSON_COLUMNS)
      .single(),
    'Création de la leçon',
  ) as LessonRow;
}

export async function updateLesson(id: string, input: Partial<LessonInput>): Promise<LessonRow> {
  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = cleanLocalized(input.title);
  if (input.published !== undefined) values.published = !!input.published;
  if (input.unit_id !== undefined) values.unit_id = input.unit_id;
  return check(
    await requireDb().from('lessons').update(values).eq('id', id).select(LESSON_COLUMNS).single(),
    'Mise à jour de la leçon',
  ) as LessonRow;
}

export async function deleteLesson(id: string) {
  check(await requireDb().from('lessons').delete().eq('id', id), 'Suppression de la leçon');
}

// ---------------------------------------------------------------------------
// One lesson: its words and activities
// ---------------------------------------------------------------------------

export async function getLesson(id: string): Promise<LessonDetail> {
  const client = requireDb();
  const [lessonRes, wordsRes, activitiesRes] = await Promise.all([
    client
      .from('lessons')
      .select(`${LESSON_COLUMNS}, units(${UNIT_COLUMNS})`)
      .eq('id', id)
      .maybeSingle(),
    client
      .from('lesson_words')
      .select(`position, words(${WORD_COLUMNS})`)
      .eq('lesson_id', id)
      .order('position'),
    client
      .from('activities')
      .select('id, type, data, position')
      .eq('lesson_id', id)
      .order('position'),
  ]);
  const row = check(lessonRes, 'Lecture de la leçon') as unknown as
    (LessonRow & { units: UnitRow }) | null;
  if (!row) throw new HttpError(404, 'Leçon introuvable.');
  const { units, ...lesson } = row;
  const words = (check(wordsRes, 'Lecture des mots') as unknown as { words: WordRow | null }[])
    .map((r) => r.words)
    .filter((w): w is WordRow => !!w);
  const activities = (check(activitiesRes, 'Lecture des activités') as ActivityDraft[]).map(
    ({ id, type, data }) => ({ id, type, data }) as ActivityDraft,
  );
  return { lesson, unit: units, words, activities };
}

export async function setLessonWords(lessonId: string, wordIds: string[]) {
  const client = requireDb();
  check(await client.from('lesson_words').delete().eq('lesson_id', lessonId), 'Mots de la leçon');
  const unique = [...new Set(wordIds)];
  if (unique.length) {
    check(
      await client
        .from('lesson_words')
        .insert(unique.map((word_id, position) => ({ lesson_id: lessonId, word_id, position }))),
      'Mots de la leçon',
    );
  }
}

function cleanActivity(a: ActivityDraft): ActivityPayload {
  if (!ACTIVITY_TYPES.includes(a.type))
    throw new HttpError(400, `Type d’activité inconnu : ${a.type}`);
  if (!a.data || typeof a.data !== 'object') throw new HttpError(400, 'Activité sans contenu.');
  return { type: a.type, data: a.data } as ActivityPayload;
}

/** Replaces the lesson's activities with this ordered list. */
export async function setActivities(lessonId: string, activities: ActivityDraft[]) {
  const client = requireDb();
  const rows = activities.map(cleanActivity);
  check(await client.from('activities').delete().eq('lesson_id', lessonId), 'Activités');
  if (rows.length) {
    check(
      await client.from('activities').insert(
        rows.map((a, position) => ({
          lesson_id: lessonId,
          position,
          type: a.type,
          data: a.data,
        })),
      ),
      'Activités',
    );
  }
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export async function listWords(): Promise<WordRow[]> {
  return check(
    await requireDb().from('words').select(WORD_COLUMNS).order('vi').limit(10000),
    'Lecture des mots',
  ) as WordRow[];
}

function cleanWord(input: Partial<WordInput>) {
  const out: Record<string, unknown> = {};
  if (input.vi !== undefined) {
    const vi = text(input.vi);
    if (!vi) throw new HttpError(400, 'Le mot vietnamien est obligatoire.');
    out.vi = vi.normalize('NFC');
  }
  if (input.unit_id !== undefined) out.unit_id = input.unit_id || null;
  if (input.meaning !== undefined) out.meaning = cleanLocalized(input.meaning);
  if (input.alternatives !== undefined) out.alternatives = cleanList(input.alternatives);
  if (input.kind !== undefined) out.kind = input.kind === 'expression' ? 'expression' : 'word';
  if (input.north !== undefined) out.north = text(input.north)?.normalize('NFC') ?? null;
  if (input.note !== undefined) out.note = cleanLocalized(input.note);
  if (input.example_vi !== undefined)
    out.example_vi = text(input.example_vi)?.normalize('NFC') ?? null;
  if (input.example_meaning !== undefined)
    out.example_meaning = cleanLocalized(input.example_meaning);
  if (input.audio_url !== undefined) out.audio_url = text(input.audio_url);
  if (input.example_audio_url !== undefined) out.example_audio_url = text(input.example_audio_url);
  return out;
}

export async function createWord(input: WordInput): Promise<WordRow> {
  const values = cleanWord(input);
  if (!values.vi) throw new HttpError(400, 'Le mot vietnamien est obligatoire.');
  return check(
    await requireDb()
      .from('words')
      .insert({ ...values, key: newKey(values.vi as string) })
      .select(WORD_COLUMNS)
      .single(),
    'Création du mot',
  ) as WordRow;
}

export async function updateWord(id: string, input: Partial<WordInput>): Promise<WordRow> {
  return check(
    await requireDb()
      .from('words')
      .update(cleanWord(input))
      .eq('id', id)
      .select(WORD_COLUMNS)
      .single(),
    'Mise à jour du mot',
  ) as WordRow;
}

/** Deletes a word and the activities built on it (it is also removed from pair exercises). */
export async function deleteWord(id: string) {
  const client = requireDb();
  check(await client.from('activities').delete().eq('data->>word_id', id), 'Activités du mot');
  const matches = check(
    await client
      .from('activities')
      .select('id, data')
      .eq('type', 'match')
      .contains('data', { word_ids: [id] }),
    'Paires du mot',
  ) as { id: string; data: { word_ids: string[] } }[];
  for (const m of matches) {
    const word_ids = m.data.word_ids.filter((w) => w !== id);
    check(
      word_ids.length >= 2
        ? await client.from('activities').update({ data: { word_ids } }).eq('id', m.id)
        : await client.from('activities').delete().eq('id', m.id),
      'Paires du mot',
    );
  }
  check(await client.from('words').delete().eq('id', id), 'Suppression du mot');
}

// ---------------------------------------------------------------------------
// Recordings
// ---------------------------------------------------------------------------

const AUDIO_BUCKET = 'audio';
const AUDIO_TYPES: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
};

/**
 * Uploads a recording to the public "audio" bucket and returns its URL.
 * `name` (the word, or "sentence") only names the file.
 */
export async function uploadAudio(name: string, file: File): Promise<string> {
  const ext =
    AUDIO_TYPES[file.type] ??
    (/\.mp3$/i.test(file.name) ? 'mp3' : /\.m4a$/i.test(file.name) ? 'm4a' : null);
  if (!ext) throw new HttpError(400, 'Formats acceptés : MP3 ou M4A.');
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, 'Fichier trop lourd (10 Mo maximum).');

  const storage = requireDb().storage.from(AUDIO_BUCKET);
  const objectPath = `${slugify(name) || 'audio'}-${Date.now()}.${ext}`;
  const { error } = await storage.upload(objectPath, await file.arrayBuffer(), {
    contentType: ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4',
    upsert: false,
  });
  if (error) {
    throw new HttpError(
      500,
      `Envoi de l’audio : ${error.message}. La migration du bucket « audio » est-elle appliquée ?`,
    );
  }
  return storage.getPublicUrl(objectPath).data.publicUrl;
}
