import { localize, stripTones, type WordRow } from '@chao/shared';
import { MapPin, Plus, Search, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { CourseUnit } from '../../shared/api';
import { Badge, Button, useToast } from '../components/ui';
import { WordDialog } from '../components/WordDialog';
import { api } from '../lib/api';
import { plural } from '../lib/labels';
import { unitVars } from '../theme';

const NO_THEME = '__none__';

/** The word bank: every word and expression, by theme, with their recordings. */
export function WordsPage() {
  const [words, setWords] = useState<WordRow[] | null>(null);
  const [course, setCourse] = useState<CourseUnit[]>([]);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<string | null>(null);
  const [missingAudio, setMissingAudio] = useState(false);
  const [editing, setEditing] = useState<WordRow | 'new' | null>(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.words(), api.course()]).then(
      ([w, c]) => {
        setWords(w);
        setCourse(c);
      },
      (e: Error) => toast(e.message, 'error'),
    );
  }, [toast]);

  const norm = (s: string) => stripTones(s).toLowerCase();
  const q = norm(query.trim());
  const shown = (words ?? []).filter(
    (w) =>
      (!theme || (theme === NO_THEME ? !w.unit_id : w.unit_id === theme)) &&
      (!missingAudio || !w.audio_url) &&
      (!q || norm(w.vi).includes(q) || norm(localize(w.meaning)).includes(q)),
  );
  const withoutAudio = words?.filter((w) => !w.audio_url).length ?? 0;
  const unitOf = new Map(course.map((u) => [u.id, u]));

  return (
    <main className="page">
      <div className="page-head">
        <div className="grow">
          <h1 className="t-title">Vocabulaire</h1>
          <p className="c-secondary">
            La banque de mots et d’expressions.{' '}
            {words ? `${plural(words.length, 'mot', 'mots')}, ${withoutAudio} sans audio.` : null}
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setEditing('new')}>
          Nouveau mot
        </Button>
      </div>

      <div className="filters">
        <div className="search grow">
          <Search size={18} />
          <input
            className="input"
            value={query}
            placeholder="Chercher en vietnamien ou en anglais"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="filters">
        <button type="button" className="chip" aria-pressed={!theme} onClick={() => setTheme(null)}>
          Toutes
        </button>
        {course.map((u) => (
          <button
            key={u.id}
            type="button"
            className="chip chip-unit"
            style={unitVars(u.color)}
            aria-pressed={theme === u.id}
            onClick={() => setTheme(theme === u.id ? null : u.id)}>
            {localize(u.title)} <span className="chip-count">{u.word_count}</span>
          </button>
        ))}
        <button
          type="button"
          className="chip"
          aria-pressed={theme === NO_THEME}
          onClick={() => setTheme(NO_THEME)}>
          Sans thématique
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={missingAudio}
          onClick={() => setMissingAudio(!missingAudio)}>
          <VolumeX size={14} /> Sans audio <span className="chip-count">{withoutAudio}</span>
        </button>
      </div>

      {!words ? (
        <div className="empty">
          <span className="spinner" />
        </div>
      ) : !shown.length ? (
        <div className="empty">Aucun mot.</div>
      ) : (
        <div className="word-grid">
          {shown.map((w) => {
            const unit = w.unit_id ? unitOf.get(w.unit_id) : undefined;
            return (
              <button
                key={w.id}
                type="button"
                className="card word-card"
                style={unitVars(unit?.color ?? 'jade')}
                onClick={() => setEditing(w)}>
                <div className="row">
                  <span className="t-heading vi c-unit grow">{w.vi}</span>
                  {w.audio_url ? (
                    <Volume2 size={18} className="c-unit" />
                  ) : (
                    <VolumeX size={18} className="c-muted" />
                  )}
                </div>
                <p className="t-bold">{localize(w.meaning)}</p>
                <div className="row row-wrap">
                  {unit ? <Badge color={unit.color}>{localize(unit.title)}</Badge> : null}
                  {w.kind === 'expression' ? <Badge tone="primary">Expression</Badge> : null}
                  {w.north ? (
                    <Badge>
                      <MapPin size={12} /> Nord : {w.north}
                    </Badge>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {editing ? (
        <WordDialog
          word={editing === 'new' ? null : editing}
          units={course}
          defaultUnitId={theme && theme !== NO_THEME ? theme : null}
          onClose={() => setEditing(null)}
          onSaved={(w) => {
            setWords((list) =>
              list?.some((x) => x.id === w.id)
                ? list.map((x) => (x.id === w.id ? w : x))
                : [...(list ?? []), w],
            );
            setEditing(null);
          }}
          onDeleted={(id) => {
            setWords((list) => list?.filter((x) => x.id !== id) ?? list);
            setEditing(null);
          }}
        />
      ) : null}
    </main>
  );
}
