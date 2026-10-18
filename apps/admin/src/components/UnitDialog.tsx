import type { UnitRow } from '@chao/shared';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { UnitInput } from '../../shared/api';
import { api } from '../lib/api';
import { LocalizedInput } from './LocalizedInput';
import { Button, ColorPicker, Dialog, Field, IconPicker, Toggle, useToast } from './ui';

/** Create or edit a unit (a theme, a stretch of the river). */
export function UnitDialog({
  unit,
  onSaved,
  onClose,
}: {
  /** null: new unit. */
  unit: UnitRow | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<UnitInput>(() => ({
    title: unit?.title ?? {},
    description: unit?.description ?? {},
    color: unit?.color ?? 'jade',
    icon: unit?.icon ?? 'hello',
    published: unit?.published ?? false,
  }));
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();
  const set = (patch: Partial<UnitInput>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setBusy(true);
    try {
      if (unit) await api.updateUnit(unit.id, draft);
      else await api.createUnit(draft);
      toast(unit ? 'Unité enregistrée.' : 'Unité créée.', 'success');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(false);
    }
  }

  async function remove() {
    if (!unit) return;
    setBusy(true);
    try {
      await api.deleteUnit(unit.id);
      toast('Unité supprimée.', 'success');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={unit ? 'Modifier l’unité' : 'Nouvelle unité'}
      onClose={onClose}
      actions={
        <>
          {unit ? (
            confirmDelete ? (
              <Button variant="danger" loading={busy} icon={<Trash2 size={18} />} onClick={remove}>
                Supprimer définitivement
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
          <Button
            loading={busy}
            disabled={!draft.title.en?.trim()}
            icon={<Save size={18} />}
            onClick={save}>
            Enregistrer
          </Button>
        </>
      }>
      {confirmDelete ? (
        <div className="notice notice-danger">
          Les leçons de l’unité et la progression des apprenants sur celles-ci seront supprimées.
          Les mots sont conservés (sans thématique).
        </div>
      ) : null}
      <Field label="Titre">
        <LocalizedInput
          value={draft.title}
          placeholder="Greetings"
          onChange={(title) => set({ title })}
        />
      </Field>
      <Field label="Sous-titre">
        <LocalizedInput
          value={draft.description}
          placeholder="Say hello the Saigon way"
          onChange={(description) => set({ description })}
        />
      </Field>
      <Field label="Couleur">
        <ColorPicker value={draft.color} onChange={(color) => set({ color })} />
      </Field>
      <Field label="Illustration">
        <IconPicker value={draft.icon} color={draft.color} onChange={(icon) => set({ icon })} />
      </Field>
      <Toggle
        checked={draft.published}
        onChange={(published) => set({ published })}
        label="Publiée (visible dans l’app)"
      />
    </Dialog>
  );
}
