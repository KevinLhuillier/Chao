import { NEEDS_AUDIO, localize, type Sentence, type WordRow } from '@chao/shared';
import { AlertTriangle, ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';

import type { ActivityDraft } from '../../shared/api';
import { ACTIVITY_LABELS } from '../lib/labels';
import { AudioField } from './AudioField';
import { LocalizedInput, fromList, toList } from './LocalizedInput';
import { Badge, Button, Field } from './ui';

type Props = {
  index: number;
  count: number;
  activity: ActivityDraft;
  lessonWords: WordRow[];
  allWords: Map<string, WordRow>;
  onChange: (a: ActivityDraft) => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

/** Problems that make the app skip or downgrade an activity. */
export function activityIssues(a: ActivityDraft, words: Map<string, WordRow>): string[] {
  const issues: string[] = [];
  if (a.type === 'match') {
    const found = a.data.word_ids.filter((id) => words.has(id));
    if (found.length < 2) issues.push('Choisir au moins 2 mots.');
    return issues;
  }
  if (a.type === 'build_vi' || a.type === 'build_meaning') {
    if (!a.data.sentence.vi?.trim()) issues.push('Phrase vietnamienne manquante.');
    if (!localize(a.data.sentence.meaning)) issues.push('Traduction manquante.');
    return issues;
  }
  const word = words.get(a.data.word_id);
  if (!word) issues.push('Choisir un mot.');
  else if (NEEDS_AUDIO.includes(a.type) && !word.audio_url) {
    issues.push('Ce mot n’a pas d’audio : l’app jouera la version sans écoute.');
  }
  return issues;
}

export function ActivityCard({
  index,
  count,
  activity,
  lessonWords,
  allWords,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: Props) {
  const meta = ACTIVITY_LABELS[activity.type];
  const Glyph = meta.icon;
  const issues = activityIssues(activity, allWords);

  return (
    <article className="card activity">
      <header className="activity-head">
        <span className="activity-num">{index + 1}</span>
        <span className="activity-icon">
          <Glyph size={18} />
        </span>
        <div className="grow">
          <p className="t-bold">{meta.label}</p>
          <p className="t-caption c-muted">{meta.hint}</p>
        </div>
        {issues.length ? (
          <Badge tone="xp">
            <AlertTriangle size={14} /> À compléter
          </Badge>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Monter"
          title="Monter"
          disabled={index === 0}
          onClick={() => onMove(-1)}>
          <ArrowUp size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Descendre"
          title="Descendre"
          disabled={index === count - 1}
          onClick={() => onMove(1)}>
          <ArrowDown size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dupliquer"
          title="Dupliquer"
          onClick={onDuplicate}>
          <Copy size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Supprimer"
          title="Supprimer"
          onClick={onDelete}>
          <Trash2 size={16} />
        </Button>
      </header>

      <div className="activity-body">
        {activity.type === 'match' ? (
          <MatchEditor
            ids={activity.data.word_ids}
            lessonWords={lessonWords}
            allWords={allWords}
            onChange={(word_ids) => onChange({ ...activity, data: { word_ids } })}
          />
        ) : activity.type === 'build_vi' || activity.type === 'build_meaning' ? (
          <SentenceEditor
            sentence={activity.data.sentence}
            toVi={activity.type === 'build_vi'}
            lessonWords={lessonWords}
            onChange={(sentence) => onChange({ ...activity, data: { sentence } })}
          />
        ) : (
          <WordSelect
            value={activity.data.word_id}
            lessonWords={lessonWords}
            allWords={allWords}
            onChange={(word_id) => onChange({ ...activity, data: { word_id } } as ActivityDraft)}
          />
        )}
        {issues.map((issue) => (
          <p key={issue} className="t-caption c-danger row">
            <AlertTriangle size={14} /> {issue}
          </p>
        ))}
      </div>
    </article>
  );
}

const wordLabel = (w: WordRow) => `${w.vi} — ${localize(w.meaning)}${w.audio_url ? ' 🔊' : ''}`;

function WordSelect({
  value,
  lessonWords,
  allWords,
  onChange,
}: {
  value: string;
  lessonWords: WordRow[];
  allWords: Map<string, WordRow>;
  onChange: (id: string) => void;
}) {
  const inLesson = new Set(lessonWords.map((w) => w.id));
  const others = [...allWords.values()].filter((w) => !inLesson.has(w.id));
  return (
    <select className="input input-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Choisir un mot —</option>
      <optgroup label="Mots de la leçon">
        {lessonWords.map((w) => (
          <option key={w.id} value={w.id}>
            {wordLabel(w)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Autres mots (révision)">
        {others.map((w) => (
          <option key={w.id} value={w.id}>
            {wordLabel(w)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function MatchEditor({
  ids,
  lessonWords,
  allWords,
  onChange,
}: {
  ids: string[];
  lessonWords: WordRow[];
  allWords: Map<string, WordRow>;
  onChange: (ids: string[]) => void;
}) {
  // Lesson words, plus words picked earlier that are no longer in the lesson.
  const extra = ids
    .map((id) => allWords.get(id))
    .filter((w): w is WordRow => !!w && !lessonWords.includes(w));
  const options = [...lessonWords, ...extra];
  return (
    <div className="pairs">
      {options.map((w) => {
        const checked = ids.includes(w.id);
        return (
          <label key={w.id} className={`pair ${checked ? 'pair-on' : ''}`}>
            <input
              type="checkbox"
              checked={checked}
              disabled={!checked && ids.length >= 6}
              onChange={(e) =>
                onChange(e.target.checked ? [...ids, w.id] : ids.filter((id) => id !== w.id))
              }
            />
            <span className="t-bold vi">{w.vi}</span>
            <span className="c-secondary">{localize(w.meaning)}</span>
          </label>
        );
      })}
      {!options.length ? <p className="c-muted">Ajoute d’abord des mots à la leçon.</p> : null}
    </div>
  );
}

function SentenceEditor({
  sentence,
  toVi,
  lessonWords,
  onChange,
}: {
  sentence: Sentence;
  toVi: boolean;
  lessonWords: WordRow[];
  onChange: (s: Sentence) => void;
}) {
  const set = (patch: Partial<Sentence>) => onChange({ ...sentence, ...patch });
  const withExample = lessonWords.filter((w) => w.example_vi);
  const lines = (s: string) =>
    s
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <div className="stack">
      {withExample.length ? (
        <select
          className="input input-sm"
          value=""
          onChange={(e) => {
            const w = withExample.find((x) => x.id === e.target.value);
            if (w)
              onChange({
                ...sentence,
                vi: w.example_vi!,
                meaning: w.example_meaning,
                audio_url: w.example_audio_url,
              });
          }}>
          <option value="">Reprendre l’exemple d’un mot…</option>
          {withExample.map((w) => (
            <option key={w.id} value={w.id}>
              {w.example_vi}
            </option>
          ))}
        </select>
      ) : null}
      <div className="grid-2">
        <Field label="Phrase vietnamienne">
          <input
            className="input input-vi"
            value={sentence.vi}
            placeholder="Tui tên là Lan."
            onChange={(e) => set({ vi: e.target.value })}
          />
        </Field>
        <Field label="Traduction">
          <LocalizedInput
            value={sentence.meaning}
            placeholder="My name is Lan."
            onChange={(meaning) => set({ meaning })}
          />
        </Field>
      </div>
      <div className="grid-2">
        {toVi ? (
          <>
            <Field label="Autres réponses acceptées" hint="une par ligne">
              <textarea
                className="input"
                rows={2}
                value={(sentence.alternatives_vi ?? []).join('\n')}
                onChange={(e) => set({ alternatives_vi: lines(e.target.value) })}
              />
            </Field>
            <Field label="Étiquettes pièges" hint="virgules ; vide = automatique">
              <input
                className="input input-vi"
                value={fromList(sentence.extra_vi)}
                placeholder="tôi, gì"
                onChange={(e) => set({ extra_vi: toList(e.target.value) })}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Autres réponses acceptées" hint="une par ligne">
              <textarea
                className="input"
                rows={2}
                value={(sentence.alternatives?.en ?? []).join('\n')}
                onChange={(e) =>
                  set({ alternatives: { ...sentence.alternatives, en: lines(e.target.value) } })
                }
              />
            </Field>
            <Field label="Étiquettes pièges" hint="virgules ; vide = automatique">
              <input
                className="input"
                value={fromList(sentence.extra?.en)}
                placeholder="your, is"
                onChange={(e) => set({ extra: { ...sentence.extra, en: toList(e.target.value) } })}
              />
            </Field>
          </>
        )}
      </div>
      {!toVi ? (
        <AudioField
          value={sentence.audio_url}
          name="phrase"
          label="Audio de la phrase"
          onChange={(audio_url) => set({ audio_url })}
        />
      ) : null}
    </div>
  );
}
