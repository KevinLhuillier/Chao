/**
 * Chao — content model shared by the mobile app and the admin.
 *
 * Rows are typed exactly as they come out of Supabase (snake_case), so both
 * apps use them without a mapping layer. Everything the learner reads in their
 * own language is a `LocalizedText` ({ en: "Hello", fr: "Bonjour" … }): adding a
 * language is a matter of filling a new key, no schema change.
 */

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

/** Learner (interface) languages the app knows about. Only English is live for now. */
export const LANGS = ['en', 'fr', 'es'] as const;
export type Lang = (typeof LANGS)[number];

/** Languages content is written in today (the admin shows one input per language). */
export const CONTENT_LANGS: readonly Lang[] = ['en'];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_NAMES: Record<Lang, string> = { en: 'English', fr: 'Français', es: 'Español' };

export type LocalizedText = Partial<Record<Lang, string>>;
export type LocalizedList = Partial<Record<Lang, string[]>>;

/** Text in `lang`, falling back to English, then to any filled language. */
export function localize(text: LocalizedText | null | undefined, lang: Lang = DEFAULT_LANG) {
  if (!text) return '';
  return text[lang] || text[DEFAULT_LANG] || Object.values(text).find(Boolean) || '';
}

export function localizeList(list: LocalizedList | null | undefined, lang: Lang = DEFAULT_LANG) {
  if (!list) return [];
  return list[lang]?.length ? list[lang] : (list[DEFAULT_LANG] ?? []);
}

// ---------------------------------------------------------------------------
// Content rows
// ---------------------------------------------------------------------------

/** Colors a unit (theme) can take; mapped to the palette by each app. */
export const UNIT_COLORS = ['jade', 'lantern', 'lotus', 'gold', 'bamboo', 'sky'] as const;
export type UnitColor = (typeof UNIT_COLORS)[number];

/** Illustrations a unit can show on its banner (drawn by the app). */
export const UNIT_ICONS = [
  'hello',
  'family',
  'food',
  'market',
  'numbers',
  'travel',
  'time',
  'home',
  'weather',
  'feelings',
] as const;
export type UnitIcon = (typeof UNIT_ICONS)[number];

/** A unit = a theme of the course, a stretch of the river. */
export type UnitRow = {
  id: string;
  key: string;
  position: number;
  title: LocalizedText;
  description: LocalizedText;
  color: UnitColor;
  icon: UnitIcon;
  published: boolean;
};

/** A lesson = a stop on the river (a lily pad), made of activities. */
export type LessonRow = {
  id: string;
  unit_id: string;
  key: string;
  position: number;
  title: LocalizedText;
  published: boolean;
};

export type WordKind = 'word' | 'expression';

/** A word or a useful expression, as heard in the South (Saigon, Mekong Delta). */
export type WordRow = {
  id: string;
  key: string;
  /** Theme it is listed under in the learner's vocabulary. */
  unit_id: string | null;
  vi: string;
  meaning: LocalizedText;
  /** Other accepted translations when the learner types the meaning. */
  alternatives: LocalizedList;
  kind: WordKind;
  /** Northern (Hanoi) equivalent, when the South says it differently. */
  north: string | null;
  /** Usage or pronunciation tip. */
  note: LocalizedText;
  example_vi: string | null;
  example_meaning: LocalizedText;
  /** Recording of the word (MP3 in the public "audio" bucket). */
  audio_url: string | null;
  /** Recording of the example sentence. */
  example_audio_url: string | null;
};

/** A sentence to rebuild from tiles. */
export type Sentence = {
  vi: string;
  meaning: LocalizedText;
  /** Other accepted Vietnamese answers. */
  alternatives_vi?: string[];
  /** Other accepted answers in the learner's language. */
  alternatives?: LocalizedList;
  /** Extra Vietnamese tiles that are not part of the answer. */
  extra_vi?: string[];
  /** Extra tiles in the learner's language. */
  extra?: LocalizedList;
  audio_url?: string | null;
};

/** Every activity type and its payload. No speaking: the app never uses the microphone. */
export type ActivityDataMap = {
  /** Lesson card: introduces a word (audio, meaning, tips). */
  learn: { word_id: string };
  /** "What does «xin chào» mean?" — options in the learner's language. */
  choice_meaning: { word_id: string };
  /** "How do you say «hello»?" — options in Vietnamese. */
  choice_vi: { word_id: string };
  /** Listen and pick the Vietnamese you heard. */
  listen_choice: { word_id: string };
  /** Write the translation of a Vietnamese word. */
  type_meaning: { word_id: string };
  /** Write the Vietnamese for a word in the learner's language. */
  type_vi: { word_id: string };
  /** Dictation: listen and write the Vietnamese. */
  listen_type: { word_id: string };
  /** Match Vietnamese words with their meanings. */
  match: { word_ids: string[] };
  /** Rebuild the Vietnamese sentence from tiles. */
  build_vi: { sentence: Sentence };
  /** Rebuild the translation of a Vietnamese sentence from tiles. */
  build_meaning: { sentence: Sentence };
};

export type ActivityType = keyof ActivityDataMap;

export const ACTIVITY_TYPES = [
  'learn',
  'choice_meaning',
  'choice_vi',
  'listen_choice',
  'type_meaning',
  'type_vi',
  'listen_type',
  'match',
  'build_vi',
  'build_meaning',
] as const satisfies readonly ActivityType[];

export type ActivityPayload = {
  [T in ActivityType]: { type: T; data: ActivityDataMap[T] };
}[ActivityType];

export type ActivityRow = ActivityPayload & { id: string; lesson_id: string; position: number };

/** Activities that cannot be played without a recording. */
export const NEEDS_AUDIO: readonly ActivityType[] = ['listen_choice', 'listen_type'];

/** Word ids an activity refers to. */
export function activityWordIds(a: ActivityPayload): string[] {
  if (a.type === 'match') return a.data.word_ids;
  if (a.type === 'build_vi' || a.type === 'build_meaning') return [];
  return [a.data.word_id];
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

/** Removes Vietnamese tone marks and diacritics ("Xin chào" → "Xin chao", "đi" → "di"). */
export function stripTones(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** Lowercase, NFC, no punctuation, single spaces. */
export function normalizeAnswer(s: string) {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:¡¿"“”«»()…-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "to eat" ≈ "eat", "a bowl" ≈ "bowl": learners rarely type the article. */
function relaxMeaning(s: string) {
  return normalizeAnswer(s).replace(/^(to|a|an|the) /, '');
}

function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}

/**
 * correct   exact match
 * almost    right but with a small mistake (missing tone marks, one typo):
 *           counted as correct, the app shows the proper spelling
 * wrong
 */
export type Verdict = 'correct' | 'almost' | 'wrong';

/** Checks a typed Vietnamese answer. Missing tone marks only make it "almost". */
export function checkVietnamese(input: string, accepted: string[]): Verdict {
  const answer = normalizeAnswer(input);
  if (!answer) return 'wrong';
  const targets = accepted.map(normalizeAnswer);
  if (targets.includes(answer)) return 'correct';
  const bare = stripTones(answer);
  if (targets.some((t) => stripTones(t) === bare)) return 'almost';
  return 'wrong';
}

/** Checks a typed translation: articles are optional, one typo is forgiven on longer words. */
export function checkMeaning(input: string, accepted: string[]): Verdict {
  const answer = relaxMeaning(input);
  if (!answer) return 'wrong';
  const targets = accepted.map(relaxMeaning);
  if (targets.includes(answer)) return 'correct';
  const close = targets.some(
    (t) => t.length >= 5 && levenshtein(stripTones(t), stripTones(answer)) <= 1,
  );
  return close ? 'almost' : 'wrong';
}

/** Accepted translations of a word: the meaning plus its alternatives. A "/" separates variants. */
export function acceptedMeanings(word: WordRow, lang: Lang = DEFAULT_LANG) {
  const main = localize(word.meaning, lang)
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...main, ...localizeList(word.alternatives, lang)];
}

/** Tiles of a sentence: one per space-separated chunk, punctuation dropped. */
export function sentenceTiles(s: string) {
  return normalizeAnswer(s).split(' ').filter(Boolean);
}

// ---------------------------------------------------------------------------
// Activity generator
// ---------------------------------------------------------------------------

/**
 * A ready-to-play sequence from a list of words, Duolingo style: each word is
 * taught then quizzed both ways, the group is matched, typed and heard, and
 * the words' example sentences become tile exercises.
 * Used by the admin ("Générer") and by the app's free practice.
 */
export function generateActivities(
  words: WordRow[],
  opts: { teach?: boolean } = {},
): ActivityPayload[] {
  const teach = opts.teach ?? true;
  const out: ActivityPayload[] = [];

  words.forEach((w, i) => {
    if (teach) out.push({ type: 'learn', data: { word_id: w.id } });
    out.push({
      type: i % 2 === 0 ? 'choice_meaning' : 'choice_vi',
      data: { word_id: w.id },
    });
    // Revisit the previous word right after a new one, so it sticks.
    const prev = words[i - 1];
    if (prev)
      out.push({ type: i % 2 === 0 ? 'choice_vi' : 'choice_meaning', data: { word_id: prev.id } });
  });

  if (words.length >= 3)
    out.push({ type: 'match', data: { word_ids: words.slice(0, 5).map((w) => w.id) } });

  words.forEach((w, i) => {
    if (w.audio_url) {
      out.push({ type: i % 2 === 0 ? 'listen_choice' : 'listen_type', data: { word_id: w.id } });
    }
    out.push({ type: i % 2 === 0 ? 'type_meaning' : 'type_vi', data: { word_id: w.id } });
  });

  words
    .filter((w) => w.example_vi && localize(w.example_meaning))
    .forEach((w, i) => {
      const sentence: Sentence = {
        vi: w.example_vi!,
        meaning: w.example_meaning,
        audio_url: w.example_audio_url,
      };
      out.push(
        i % 2 === 0
          ? { type: 'build_meaning', data: { sentence } }
          : { type: 'build_vi', data: { sentence } },
      );
    });

  return out;
}

/** Fisher–Yates shuffle (new array). */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** "Xin chào!" → "xin-chao", for stable keys. */
export function slugify(s: string) {
  return stripTones(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
