import { localize, type UnitRow } from '@chao/shared';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sailboat,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { CourseUnit } from '../../shared/api';
import { UnitDialog } from '../components/UnitDialog';
import { Badge, Button, useToast } from '../components/ui';
import { api } from '../lib/api';
import { ICONS, plural } from '../lib/labels';
import { navigate } from '../lib/router';
import { unitVars } from '../theme';

/** The whole river: units in order, each with its lessons. */
export function CoursePage() {
  const [course, setCourse] = useState<CourseUnit[] | null>(null);
  const [editing, setEditing] = useState<UnitRow | 'new' | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    api.course().then(setCourse, (e: Error) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  async function move(
    list: { id: string }[],
    i: number,
    delta: number,
    save: (ids: string[]) => Promise<void>,
  ) {
    const ids = list.map((x) => x.id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    try {
      await save(ids);
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function addLesson(unit: CourseUnit) {
    const title = window.prompt('Titre de la leçon (anglais)');
    if (!title?.trim()) return;
    try {
      const lesson = await api.createLesson(unit.id, title);
      navigate.lesson(lesson.id);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function togglePublished(kind: 'unit' | 'lesson', id: string, published: boolean) {
    try {
      if (kind === 'unit') await api.updateUnit(id, { published });
      else await api.updateLesson(id, { published });
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const lessons = course?.reduce((n, u) => n + u.lessons.length, 0) ?? 0;

  return (
    <main className="page">
      <div className="page-head">
        <div className="grow">
          <h1 className="t-title">Le parcours</h1>
          <p className="c-secondary">
            Un seul fleuve : les unités (thématiques) se suivent, chaque leçon est une étape.{' '}
            {course
              ? `${plural(course.length, 'unité', 'unités')}, ${plural(lessons, 'leçon', 'leçons')}.`
              : null}
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setEditing('new')}>
          Nouvelle unité
        </Button>
      </div>

      {!course ? (
        <div className="empty">
          <span className="spinner" />
        </div>
      ) : !course.length ? (
        <div className="empty">
          <Sailboat size={40} />
          <p>
            Le fleuve est vide. Crée une unité, ou charge le contenu de départ avec{' '}
            <code>npm run seed</code>.
          </p>
        </div>
      ) : (
        <div className="river">
          {course.map((unit, u) => {
            const Glyph = ICONS[unit.icon]?.icon ?? BookOpen;
            return (
              <section key={unit.id} className="card unit" style={unitVars(unit.color)}>
                <header className="unit-head">
                  <span className="unit-mark">
                    <Glyph size={22} />
                  </span>
                  <div className="grow">
                    <p className="t-overline c-unit">Unité {u + 1}</p>
                    <h2 className="t-heading">{localize(unit.title) || 'Sans titre'}</h2>
                    <p className="t-caption c-secondary">
                      {localize(unit.description)} · {plural(unit.word_count, 'mot', 'mots')}
                    </p>
                  </div>
                  <PublishBadge
                    published={unit.published}
                    onToggle={() => togglePublished('unit', unit.id, !unit.published)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Monter"
                    aria-label="Monter"
                    disabled={u === 0}
                    onClick={() => move(course, u, -1, api.reorderUnits)}>
                    <ArrowUp size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Descendre"
                    aria-label="Descendre"
                    disabled={u === course.length - 1}
                    onClick={() => move(course, u, 1, api.reorderUnits)}>
                    <ArrowDown size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Modifier"
                    aria-label="Modifier l’unité"
                    onClick={() => setEditing(unit)}>
                    <Pencil size={18} />
                  </Button>
                </header>

                <ol className="lessons">
                  {unit.lessons.map((lesson, i) => (
                    <li key={lesson.id} className="lesson-row">
                      <span className="lesson-num">{i + 1}</span>
                      <button
                        type="button"
                        className="lesson-link"
                        onClick={() => navigate.lesson(lesson.id)}>
                        <span className="t-bold">{localize(lesson.title) || 'Sans titre'}</span>
                        <span className="t-caption c-muted">
                          {plural(lesson.word_count, 'mot', 'mots')} ·{' '}
                          {plural(lesson.activity_count, 'activité', 'activités')}
                        </span>
                      </button>
                      {lesson.activity_count === 0 ? <Badge tone="xp">Vide</Badge> : null}
                      <PublishBadge
                        published={lesson.published}
                        onToggle={() => togglePublished('lesson', lesson.id, !lesson.published)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Monter"
                        title="Monter"
                        disabled={i === 0}
                        onClick={() =>
                          move(unit.lessons, i, -1, (ids) => api.reorderLessons(unit.id, ids))
                        }>
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Descendre"
                        title="Descendre"
                        disabled={i === unit.lessons.length - 1}
                        onClick={() =>
                          move(unit.lessons, i, 1, (ids) => api.reorderLessons(unit.id, ids))
                        }>
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ouvrir"
                        title="Ouvrir"
                        onClick={() => navigate.lesson(lesson.id)}>
                        <ChevronRight size={18} />
                      </Button>
                    </li>
                  ))}
                </ol>
                <button type="button" className="add-line" onClick={() => addLesson(unit)}>
                  <Plus size={16} /> Ajouter une leçon
                </button>
              </section>
            );
          })}
        </div>
      )}

      {editing ? (
        <UnitDialog
          unit={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </main>
  );
}

function PublishBadge({ published, onToggle }: { published: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`badge badge-button ${published ? 'badge-success' : ''}`}
      title={published ? 'Publiée — cliquer pour masquer' : 'Brouillon — cliquer pour publier'}
      onClick={onToggle}>
      {published ? <Eye size={14} /> : <EyeOff size={14} />}
      {published ? 'Publiée' : 'Brouillon'}
    </button>
  );
}
