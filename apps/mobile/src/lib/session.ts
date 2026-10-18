/**
 * Turns a lesson's activities into playable exercises: resolves words, picks
 * wrong options and tiles, and falls back to a non-audio version when a
 * listening activity has no recording yet.
 */
import {
  acceptedMeanings,
  localize,
  localizeList,
  shuffle,
  type ActivityPayload,
  type Lang,
  type NoteBlock,
  type Sentence,
  type WordRow,
} from '@chao/shared';

type Base = { key: string; retry: boolean };

export type ChoiceMode = 'meaning' | 'vi' | 'listen';
export type TypeMode = 'meaning' | 'vi' | 'listen';

export type Exercise = Base &
  (
    | { kind: 'learn'; word: WordRow }
    | { kind: 'note'; title: string; blocks: NoteBlock[] }
    | { kind: 'choice'; mode: ChoiceMode; word: WordRow; options: string[]; answer: string }
    | { kind: 'type'; mode: TypeMode; word: WordRow; accepted: string[] }
    | { kind: 'match'; pairs: { id: string; vi: string; meaning: string; audio: string | null }[] }
    | {
        kind: 'build';
        mode: 'vi' | 'meaning';
        /** Sentence shown (or heard) to the learner. */
        prompt: string;
        audio: string | null;
        tiles: string[];
        accepted: string[];
        /** Proper answer, shown in the feedback. */
        answer: string;
      }
  );

/** Exercises that count in the lesson accuracy. */
export const isGraded = (ex: Exercise) => ex.kind !== 'learn' && ex.kind !== 'note';

/** Exercises the learner only reads: a "Continue" button instead of "Check". */
export const isCard = (ex: Exercise) => ex.kind === 'learn' || ex.kind === 'note';

const meaningOf = (w: WordRow, lang: Lang) => localize(w.meaning, lang);

/** Up to `n` wrong options, preferring words of the same theme and kind. */
function distractors(
  word: WordRow,
  pool: WordRow[],
  pick: (w: WordRow) => string,
  n: number,
): string[] {
  const answer = pick(word).toLowerCase();
  const usable = pool.filter(
    (w) => w.id !== word.id && pick(w) && pick(w).toLowerCase() !== answer,
  );
  const near = shuffle(usable.filter((w) => w.unit_id === word.unit_id && w.kind === word.kind));
  const far = shuffle(usable.filter((w) => !near.includes(w)));
  return [...new Set([...near, ...far].map(pick))].slice(0, n);
}

/** Words of a sentence, as tiles (case kept, punctuation dropped). */
function tilesOf(s: string) {
  return s
    .split(/\s+/)
    .map((t) => t.replace(/^[.,!?;:"“”«»()…]+|[.,!?;:"“”«»()…]+$/g, ''))
    .filter(Boolean);
}

/** Extra tiles taken from other words, so the answer isn't just "use them all". */
function extraTiles(answer: string[], from: string[], n: number) {
  const used = new Set(answer.map((t) => t.toLowerCase()));
  const candidates = [...new Set(from.flatMap(tilesOf))].filter((t) => !used.has(t.toLowerCase()));
  return shuffle(candidates).slice(0, n);
}

function buildExercise(
  type: 'build_vi' | 'build_meaning',
  s: Sentence,
  pool: WordRow[],
  lang: Lang,
  key: string,
): Exercise | null {
  const meaning = localize(s.meaning, lang);
  if (!s.vi || !meaning) return null;
  if (type === 'build_vi') {
    const answer = tilesOf(s.vi);
    const extra = s.extra_vi?.length
      ? s.extra_vi
      : extraTiles(
          answer,
          pool.map((w) => w.vi),
          3,
        );
    return {
      key,
      retry: false,
      kind: 'build',
      mode: 'vi',
      prompt: meaning,
      audio: null,
      tiles: shuffle([...answer, ...extra]),
      accepted: [s.vi, ...(s.alternatives_vi ?? [])],
      answer: s.vi,
    };
  }
  const answer = tilesOf(meaning);
  const custom = localizeList(s.extra, lang);
  const extra = custom.length
    ? custom
    : extraTiles(
        answer,
        pool.map((w) => meaningOf(w, lang)),
        3,
      );
  return {
    key,
    retry: false,
    kind: 'build',
    mode: 'meaning',
    prompt: s.vi,
    audio: s.audio_url ?? null,
    tiles: shuffle([...answer, ...extra]),
    accepted: [meaning, ...localizeList(s.alternatives, lang)],
    answer: meaning,
  };
}

export function buildExercises(
  activities: ActivityPayload[],
  pool: WordRow[],
  lang: Lang,
): Exercise[] {
  const byId = new Map(pool.map((w) => [w.id, w]));
  const out: Exercise[] = [];

  activities.forEach((a, i) => {
    const key = `${i}-${a.type}`;
    if (a.type === 'note') {
      if (a.data.blocks.length || localize(a.data.title, lang)) {
        const title = localize(a.data.title, lang);
        out.push({ key, retry: false, kind: 'note', title, blocks: a.data.blocks });
      }
      return;
    }
    if (a.type === 'build_vi' || a.type === 'build_meaning') {
      const ex = buildExercise(a.type, a.data.sentence, pool, lang, key);
      if (ex) out.push(ex);
      return;
    }
    if (a.type === 'match') {
      const pairs = a.data.word_ids
        .map((id) => byId.get(id))
        .filter((w): w is WordRow => !!w && !!meaningOf(w, lang))
        .map((w) => ({ id: w.id, vi: w.vi, meaning: meaningOf(w, lang), audio: w.audio_url }));
      // Two words with the same meaning would make the pairs ambiguous.
      const unique = pairs.filter(
        (p, j) => pairs.findIndex((q) => q.meaning === p.meaning || q.vi === p.vi) === j,
      );
      if (unique.length >= 2) out.push({ key, retry: false, kind: 'match', pairs: unique });
      return;
    }

    const word = byId.get(a.data.word_id);
    if (!word || !meaningOf(word, lang)) return;
    // No recording yet: same word, without the audio.
    let type = a.type;
    if (type === 'listen_choice' && !word.audio_url) type = 'choice_vi';
    if (type === 'listen_type' && !word.audio_url) type = 'type_vi';

    switch (type) {
      case 'learn':
        out.push({ key, retry: false, kind: 'learn', word });
        return;
      case 'choice_meaning':
      case 'choice_vi':
      case 'listen_choice': {
        const mode: ChoiceMode =
          type === 'choice_meaning' ? 'meaning' : type === 'choice_vi' ? 'vi' : 'listen';
        const pick = mode === 'meaning' ? (w: WordRow) => meaningOf(w, lang) : (w: WordRow) => w.vi;
        const wrong = distractors(word, pool, pick, 3);
        if (wrong.length < 2) return;
        const answer = pick(word);
        out.push({
          key,
          retry: false,
          kind: 'choice',
          mode,
          word,
          answer,
          options: shuffle([answer, ...wrong]),
        });
        return;
      }
      case 'type_meaning':
        out.push({
          key,
          retry: false,
          kind: 'type',
          mode: 'meaning',
          word,
          accepted: acceptedMeanings(word, lang),
        });
        return;
      case 'type_vi':
      case 'listen_type':
        out.push({
          key,
          retry: false,
          kind: 'type',
          mode: type === 'type_vi' ? 'vi' : 'listen',
          word,
          accepted: word.vi
            .split('/')
            .map((s) => s.trim())
            .filter(Boolean),
        });
        return;
    }
  });

  return out;
}
