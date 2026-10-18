import { localize, type UnitRow, type WordRow } from '@chao/shared';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { WordInput } from '../../shared/api';
import { api } from '../lib/api';
import { AudioField } from './AudioField';
import { LocalizedInput, fromList, toList } from './LocalizedInput';
import { Button, Dialog, Field, useToast } from './ui';

const empty = (unitId: string | null): WordInput => ({
  unit_id: unitId,
  vi: '',
  meaning: {},
  alternatives: {},
  kind: 'word',
  north: null,
  note: {},
  example_vi: null,
  example_meaning: {},
  audio_url: null,
  example_audio_url: null,
});

/** Create or edit a word / expression, with its recordings. */
export function WordDialog({
  word,
  units,
  defaultUnitId = null,
  onSaved,
  onDeleted,
  onClose,
}: {
  /** null: new word. */
  word: WordRow | null;
  units: UnitRow[];
  defaultUnitId?: string | null;
  onSaved: (word: WordRow) => void;
  onDeleted?: (id: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<WordInput>(() =>
    word
      ? {
          unit_id: word.unit_id,
          vi: word.vi,
          meaning: word.meaning,
          alternatives: word.alternatives,
          kind: word.kind,
          north: word.north,
          note: word.note,
          example_vi: word.example_vi,
          example_meaning: word.example_meaning,
          audio_url: word.audio_url,
          example_audio_url: word.example_audio_url,
        }
      : empty(defaultUnitId),
  );
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();
  const set = (patch: Partial<WordInput>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true);
    try {
      const saved = word ? await api.updateWord(word.id, draft) : await api.createWord(draft);
      toast(word ? 'Mot enregistré.' : 'Mot créé.', 'success');
      onSaved(saved);
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(false);
    }
  }

  async function remove() {
    if (!word) return;
    setBusy(true);
    try {
      await api.deleteWord(word.id);
      toast('Mot supprimé.', 'success');
      onDeleted?.(word.id);
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(false);
    }
  }

  const canSave = draft.vi.trim() && draft.meaning.en?.trim();

  return (
    <Dialog
      title={word ? `Modifier « ${word.vi} »` : 'Nouveau mot'}
      onClose={onClose}
      wide
      actions={
        <>
          {word && onDeleted ? (
            confirmDelete ? (
              <Button variant="danger" loading={busy} icon={<Trash2 size={18} />} onClick={remove}>
                Confirmer la suppression
              </Button>
            ) : (
              <Button
                variant="ghost"
                icon={<Trash2 size={18} />}
                onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )
          ) : null}
          <span className="spacer" />
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={busy} disabled={!canSave} icon={<Save size={18} />} onClick={save}>
            Enregistrer
          </Button>
        </>
      }>
      {confirmDelete ? (
        <div className="notice notice-danger">
          Les activités construites sur ce mot seront supprimées, et il sera retiré des exercices de
          paires.
        </div>
      ) : null}
      <div className="grid-2">
        <Field label="Vietnamien (accent du Sud)">
          <input
            className="input input-vi"
            value={draft.vi}
            autoFocus
            placeholder="xin chào"
            onChange={(e) => set({ vi: e.target.value })}
          />
        </Field>
        <Field label="Traduction" hint="« / » sépare deux sens">
          <LocalizedInput
            value={draft.meaning}
            placeholder="hello"
            onChange={(meaning) => set({ meaning })}
          />
        </Field>
      </div>

      <div className="grid-2">
        <Field label="Autres réponses acceptées" hint="séparées par des virgules">
          <input
            className="input"
            value={fromList(draft.alternatives.en)}
            placeholder="hi, hey"
            onChange={(e) =>
              set({ alternatives: { ...draft.alternatives, en: toList(e.target.value) } })
            }
          />
        </Field>
        <Field label="Au Nord, on dit…" hint="si différent">
          <input
            className="input input-vi"
            value={draft.north ?? ''}
            placeholder="vâng"
            onChange={(e) => set({ north: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid-2">
        <Field label="Type">
          <div className="tabs" role="tablist">
            {(['word', 'expression'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="tab"
                className="tab"
                aria-selected={draft.kind === kind}
                onClick={() => set({ kind })}>
                {kind === 'word' ? 'Mot' : 'Expression'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Thématique (page Vocabulaire)">
          <select
            className="input"
            value={draft.unit_id ?? ''}
            onChange={(e) => set({ unit_id: e.target.value || null })}>
            <option value="">— Aucune —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {localize(u.title)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <AudioField
        value={draft.audio_url}
        name={draft.vi || 'mot'}
        label="Prononciation"
        onChange={(audio_url) => set({ audio_url })}
      />

      <Field label="Astuce (usage, prononciation…)">
        <LocalizedInput
          value={draft.note}
          multiline
          placeholder="The polite “yes” of the South."
          onChange={(note) => set({ note })}
        />
      </Field>

      <div className="grid-2">
        <Field label="Exemple (vietnamien)" hint="devient un exercice de phrase">
          <input
            className="input input-vi"
            value={draft.example_vi ?? ''}
            placeholder="Dạ, em hiểu rồi."
            onChange={(e) => set({ example_vi: e.target.value })}
          />
        </Field>
        <Field label="Traduction de l’exemple">
          <LocalizedInput
            value={draft.example_meaning}
            placeholder="Yes, I understand."
            onChange={(example_meaning) => set({ example_meaning })}
          />
        </Field>
      </div>
      {draft.example_vi ? (
        <AudioField
          value={draft.example_audio_url}
          name={`${draft.vi || 'mot'}-exemple`}
          label="Audio de l’exemple"
          onChange={(example_audio_url) => set({ example_audio_url })}
        />
      ) : null}
    </Dialog>
  );
}
