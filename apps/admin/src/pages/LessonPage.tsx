import {
  ACTIVITY_TYPES,
  generateActivities,
  localize,
  stripTones,
  type ActivityType,
  type UnitRow,
  type WordRow,
} from '@chao/shared';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityDraft, CourseUnit, LessonDetail } from '../../shared/api';
import { ActivityCard, activityIssues } from '../components/ActivityCard';
import { LocalizedInput } from '../components/LocalizedInput';
import { Badge, Button, Dialog, Field, Toggle, useToast } from '../components/ui';
import { WordDialog } from '../components/WordDialog';
import { api } from '../lib/api';
import { ACTIVITY_LABELS, plural } from '../lib/labels';
import { navigate } from '../lib/router';
import { unitVars } from '../theme';

type Draft = {
  title: LessonDetail['lesson']['title'];
  published: boolean;
  unitId: string;
  wordIds: string[];
  activities: ActivityDraft[];
};

const toDraft = (d: LessonDetail): Draft => ({
  title: d.lesson.title,
  published: d.lesson.published,
  unitId: d.lesson.unit_id,
  wordIds: d.words.map((w) => w.id),
  activities: d.activities,
});

/** A new, empty activity of a type. */
function blank(type: ActivityType, firstWord?: string): ActivityDraft {
  if (type === 'match') return { type, data: { word_ids: [] } };
  if (type === 'note') return { type, data: { title: {}, blocks: [] } };
  if (type === 'build_vi' || type === 'build_meaning') {
    return { type, data: { sentence: { vi: '', meaning: {} } } };
  }
  return { type, data: { word_id: firstWord ?? '' } } as ActivityDraft;
}

/** Lesson editor: its words (left) and its sequence of activities (right). */
export function LessonPage({ id }: { id: string }) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);
  const [course, setCourse] = useState<CourseUnit[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordDialog, setWordDialog] = useState<WordRow | 'new' | null>(null);
  const [confirm, setConfirm] = useState<'delete' | 'generate' | null>(null);
  const [adding, setAdding] = useState<ActivityType>('learn');
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.lesson(id), api.words(), api.course()]).then(
      ([d, w, c]) => {
        setDetail(d);
        setDraft(toDraft(d));
        setWords(w);
        setCourse(c);
      },
      (e: Error) => toast(e.message, 'error'),
    );
  }, [id, toast]);

  const update = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => (d ? { ...d, ...(typeof patch === 'function' ? patch(d) : patch) } : d));
    setDirty(true);
  }, []);

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const lessonWords = useMemo(
    () => (draft?.wordIds ?? []).map((wid) => byId.get(wid)).filter((w): w is WordRow => !!w),
    [draft?.wordIds, byId],
  );

  const save = useCallback(async () => {
    if (!draft || !detail) return;
    setSaving(true);
    try {
      await api.updateLesson(id, {
        title: draft.title,
        published: draft.published,
        unit_id: draft.unitId,
      });
      const saved = await api.saveLessonContent(id, draft.wordIds, draft.activities);
      setDetail(saved);
      setDraft(toDraft(saved));
      setDirty(false);
      toast('Leçon enregistrée.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }, [draft, detail, id, toast]);

  // Ctrl+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  if (!draft || !detail) {
    return (
      <main className="page">
        <div className="empty">
          <span className="spinner" />
        </div>
      </main>
    );
  }

  const unit = course.find((u) => u.id === draft.unitId) ?? detail.unit;
  const units: UnitRow[] = course;
  const issues = draft.activities.filter((a) => activityIssues(a, byId).length).length;

  function setActivity(i: number, a: ActivityDraft) {
    update((d) => ({ activities: d.activities.map((x, j) => (j === i ? a : x)) }));
  }
  function moveActivity(i: number, delta: number) {
    update((d) => {
      const list = [...d.activities];
      const j = i + delta;
      if (j < 0 || j >= list.length) return {};
      [list[i], list[j]] = [list[j]!, list[i]!];
      return { activities: list };
    });
  }
  function moveWord(i: number, delta: number) {
    update((d) => {
      const list = [...d.wordIds];
      const j = i + delta;
      if (j < 0 || j >= list.length) return {};
      [list[i], list[j]] = [list[j]!, list[i]!];
      return { wordIds: list };
    });
  }

  function generate() {
    update({ activities: generateActivities(lessonWords) });
    setConfirm(null);
    toast(
      `${plural(generateActivities(lessonWords).length, 'activité générée', 'activités générées')}.`,
      'success',
    );
  }

  async function removeLesson() {
    try {
      await api.deleteLesson(id);
      setDirty(false);
      toast('Leçon supprimée.', 'success');
      navigate.course();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <main className="page" style={unitVars(unit.color)}>
      <div className="editor-bar">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour au parcours"
          title="Retour au parcours"
          onClick={() => {
            if (!dirty || window.confirm('Quitter sans enregistrer ?')) navigate.course();
          }}>
          <ArrowLeft size={20} />
        </Button>
        <div className="grow">
          <p className="t-overline c-unit">{localize(unit.title)}</p>
          <h1 className="t-heading">{localize(draft.title) || 'Sans titre'}</h1>
        </div>
        {issues ? (
          <Badge tone="xp">{plural(issues, 'activité à compléter', 'activités à compléter')}</Badge>
        ) : null}
        {dirty ? <span className="dirty-dot" title="Modifications non enregistrées" /> : null}
        <Button variant="ghost" icon={<Trash2 size={18} />} onClick={() => setConfirm('delete')}>
          Supprimer
        </Button>
        <Button loading={saving} disabled={!dirty} icon={<Save size={18} />} onClick={save}>
          Enregistrer
        </Button>
      </div>

      <div className="editor">
        <aside className="editor-side">
          <section className="card stack">
            <h2 className="card-title">La leçon</h2>
            <Field label="Titre">
              <LocalizedInput
                value={draft.title}
                placeholder="Hello!"
                onChange={(title) => update({ title })}
              />
            </Field>
            <Field label="Unité">
              <select
                className="input"
                value={draft.unitId}
                onChange={(e) => update({ unitId: e.target.value })}>
                {course.map((u, i) => (
                  <option key={u.id} value={u.id}>
                    {i + 1}. {localize(u.title)}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              checked={draft.published}
              onChange={(published) => update({ published })}
              label="Publiée"
            />
          </section>

          <section className="card stack">
            <h2 className="card-title">
              Mots enseignés <span className="c-muted">({lessonWords.length})</span>
            </h2>
            <p className="t-caption c-secondary">
              Ils rejoignent la page Vocabulaire de l’apprenant quand il termine la leçon.
            </p>
            <ul className="word-list">
              {lessonWords.map((w, i) => (
                <li key={w.id} className="word-item">
                  <span title={w.audio_url ? 'Audio présent' : 'Pas d’audio'}>
                    {w.audio_url ? (
                      <Volume2 size={16} className="c-unit" />
                    ) : (
                      <VolumeX size={16} className="c-muted" />
                    )}
                  </span>
                  <div className="grow">
                    <p className="t-bold vi">{w.vi}</p>
                    <p className="t-caption c-secondary">{localize(w.meaning)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Monter"
                    disabled={i === 0}
                    onClick={() => moveWord(i, -1)}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Descendre"
                    disabled={i === lessonWords.length - 1}
                    onClick={() => moveWord(i, 1)}>
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Modifier le mot"
                    onClick={() => setWordDialog(w)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer de la leçon"
                    onClick={() =>
                      update((d) => ({ wordIds: d.wordIds.filter((x) => x !== w.id) }))
                    }>
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
            <WordPicker
              words={words}
              exclude={new Set(draft.wordIds)}
              onPick={(w) => update((d) => ({ wordIds: [...d.wordIds, w.id] }))}
            />
            <button type="button" className="add-line" onClick={() => setWordDialog('new')}>
              <Plus size={16} /> Nouveau mot
            </button>
          </section>
        </aside>

        <section className="editor-main">
          <div className="card toolbar">
            <Button
              variant="unit"
              icon={<Wand2 size={18} />}
              disabled={!lessonWords.length}
              onClick={() => (draft.activities.length ? setConfirm('generate') : generate())}>
              Générer depuis les mots
            </Button>
            <span className="spacer" />
            <select
              className="input input-sm"
              value={adding}
              onChange={(e) => setAdding(e.target.value as ActivityType)}>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_LABELS[type].label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              icon={<Plus size={18} />}
              onClick={() =>
                update((d) => ({
                  activities: [...d.activities, blank(adding, lessonWords[0]?.id)],
                }))
              }>
              Ajouter
            </Button>
          </div>

          {!draft.activities.length ? (
            <div className="empty">
              <Wand2 size={36} />
              <p>
                Aucune activité. Ajoute des mots à la leçon puis « Générer depuis les mots » crée
                une séquence complète (cours, QCM dans les deux sens, paires, écriture, écoute,
                phrases).
              </p>
            </div>
          ) : (
            draft.activities.map((a, i) => (
              <ActivityCard
                key={i}
                index={i}
                count={draft.activities.length}
                activity={a}
                lessonWords={lessonWords}
                allWords={byId}
                onChange={(next) => setActivity(i, next)}
                onMove={(delta) => moveActivity(i, delta)}
                onDuplicate={() =>
                  update((d) => ({
                    activities: [
                      ...d.activities.slice(0, i + 1),
                      structuredClone(a),
                      ...d.activities.slice(i + 1),
                    ],
                  }))
                }
                onDelete={() =>
                  update((d) => ({ activities: d.activities.filter((_, j) => j !== i) }))
                }
              />
            ))
          )}
        </section>
      </div>

      {wordDialog ? (
        <WordDialog
          word={wordDialog === 'new' ? null : wordDialog}
          units={units}
          defaultUnitId={draft.unitId}
          onClose={() => setWordDialog(null)}
          onSaved={(w) => {
            setWords((list) =>
              list.some((x) => x.id === w.id)
                ? list.map((x) => (x.id === w.id ? w : x))
                : [...list, w],
            );
            if (wordDialog === 'new') update((d) => ({ wordIds: [...d.wordIds, w.id] }));
            setWordDialog(null);
          }}
        />
      ) : null}

      {confirm === 'generate' ? (
        <Dialog
          title="Remplacer les activités ?"
          onClose={() => setConfirm(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Annuler
              </Button>
              <Button variant="unit" icon={<Wand2 size={18} />} onClick={generate}>
                Remplacer
              </Button>
            </>
          }>
          <p>
            Les {draft.activities.length} activités actuelles seront remplacées par une séquence
            générée depuis les {lessonWords.length} mots de la leçon (rien n’est enregistré tant que
            tu ne cliques pas sur « Enregistrer »).
          </p>
        </Dialog>
      ) : null}

      {confirm === 'delete' ? (
        <Dialog
          title="Supprimer la leçon ?"
          onClose={() => setConfirm(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Annuler
              </Button>
              <Button variant="danger" icon={<Trash2 size={18} />} onClick={removeLesson}>
                Supprimer
              </Button>
            </>
          }>
          <p>
            La leçon, ses activités et la progression des apprenants sur celle-ci seront supprimées.
            Les mots restent dans la banque.
          </p>
        </Dialog>
      ) : null}
    </main>
  );
}

/** Search the word bank and add a word to the lesson. */
function WordPicker({
  words,
  exclude,
  onPick,
}: {
  words: WordRow[];
  exclude: Set<string>;
  onPick: (w: WordRow) => void;
}) {
  const [query, setQuery] = useState('');
  const norm = (s: string) => stripTones(s).toLowerCase();
  const q = norm(query.trim());
  const matches = q
    ? words
        .filter((w) => !exclude.has(w.id))
        .filter((w) => norm(w.vi).includes(q) || norm(localize(w.meaning)).includes(q))
        .slice(0, 8)
    : [];

  return (
    <div className="picker">
      <div className="search">
        <Search size={16} />
        <input
          className="input input-sm"
          value={query}
          placeholder="Ajouter un mot de la banque…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {matches.length ? (
        <ul className="picker-list">
          {matches.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(w);
                  setQuery('');
                }}>
                <span className="t-bold vi">{w.vi}</span>
                <span className="c-secondary">{localize(w.meaning)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : q ? (
        <p className="t-caption c-muted">Aucun mot trouvé.</p>
      ) : null}
    </div>
  );
}
