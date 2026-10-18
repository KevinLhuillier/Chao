import {
  localize,
  richViTokens,
  type ActivityDataMap,
  type NoteBlock,
  type NoteBlockType,
  type NoteSound,
} from '@chao/shared';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';

import { AudioField } from './AudioField';
import { LocalizedInput } from './LocalizedInput';
import { Button, Field } from './ui';

type Note = ActivityDataMap['note'];

const BLOCK_LABELS: Record<NoteBlockType, string> = {
  heading: 'Titre',
  text: 'Texte',
  tip: 'Astuce',
  sounds: 'Sons à écouter',
  example: 'Exemple',
};

function blankBlock(type: NoteBlockType): NoteBlock {
  switch (type) {
    case 'heading':
      return { type, text: {} };
    case 'text':
    case 'tip':
      return { type, text: {}, sounds: {} };
    case 'sounds':
      return { type, items: [{ vi: '', audio_url: null }] };
    case 'example':
      return { type, vi: '', meaning: {}, audio_url: null };
  }
}

/** Problems that make the app show an incomplete card. */
export function noteIssues(note: Note): string[] {
  const issues: string[] = [];
  if (!localize(note.title) && !note.blocks.length) issues.push('Ajouter un titre ou un bloc.');
  const silent = note.blocks.some((b) =>
    b.type === 'sounds'
      ? b.items.some((s) => s.vi && !s.audio_url)
      : b.type === 'text' || b.type === 'tip'
        ? richViTokens(b.text).some((vi) => !b.sounds?.[vi])
        : false,
  );
  if (silent) issues.push('Certains sons n’ont pas d’audio : ils ne seront pas cliquables.');
  return issues;
}

/** Free lesson card: a title and a list of blocks (text, sounds, examples…). */
export function NoteEditor({ note, onChange }: { note: Note; onChange: (n: Note) => void }) {
  const setBlocks = (blocks: NoteBlock[]) => onChange({ ...note, blocks });
  const setBlock = (i: number, b: NoteBlock) =>
    setBlocks(note.blocks.map((x, j) => (j === i ? b : x)));
  function move(i: number, delta: number) {
    const list = [...note.blocks];
    const [b] = list.splice(i, 1);
    list.splice(i + delta, 0, b!);
    setBlocks(list);
  }

  return (
    <div className="stack">
      <Field label="Titre de la fiche">
        <LocalizedInput
          value={note.title}
          placeholder="The Vietnamese alphabet"
          onChange={(title) => onChange({ ...note, title })}
        />
      </Field>

      {note.blocks.map((b, i) => (
        <section key={i} className="note-block stack-sm">
          <header className="row">
            <span className="t-bold grow">{BLOCK_LABELS[b.type]}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Monter le bloc"
              disabled={i === 0}
              onClick={() => move(i, -1)}>
              <ArrowUp size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Descendre le bloc"
              disabled={i === note.blocks.length - 1}
              onClick={() => move(i, 1)}>
              <ArrowDown size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Supprimer le bloc"
              onClick={() => setBlocks(note.blocks.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </Button>
          </header>
          <BlockEditor block={b} index={i} onChange={(nb) => setBlock(i, nb)} />
        </section>
      ))}

      <div className="row row-wrap note-add">
        {(Object.keys(BLOCK_LABELS) as NoteBlockType[]).map((type) => (
          <Button
            key={type}
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setBlocks([...note.blocks, blankBlock(type)])}>
            {BLOCK_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  index,
  onChange,
}: {
  block: NoteBlock;
  index: number;
  onChange: (b: NoteBlock) => void;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <LocalizedInput
          value={block.text}
          placeholder="Vowels"
          onChange={(text) => onChange({ ...block, text })}
        />
      );
    case 'text':
    case 'tip':
      return <RichTextEditor block={block} index={index} onChange={onChange} />;
    case 'sounds':
      return (
        <SoundsEditor items={block.items} onChange={(items) => onChange({ ...block, items })} />
      );
    case 'example':
      return (
        <>
          <div className="grid-2">
            <Field label="Phrase vietnamienne">
              <input
                className="input input-vi"
                value={block.vi}
                placeholder="Ba đi chợ."
                onChange={(e) => onChange({ ...block, vi: e.target.value })}
              />
            </Field>
            <Field label="Traduction">
              <LocalizedInput
                value={block.meaning}
                placeholder="Dad goes to the market."
                onChange={(meaning) => onChange({ ...block, meaning })}
              />
            </Field>
          </div>
          <AudioField
            value={block.audio_url}
            name={block.vi || 'exemple'}
            onChange={(audio_url) => onChange({ ...block, audio_url })}
          />
        </>
      );
  }
}

/** Text with **bold** and [Vietnamese]: one recording per [Vietnamese] bit. */
function RichTextEditor({
  block,
  index,
  onChange,
}: {
  block: Extract<NoteBlock, { type: 'text' | 'tip' }>;
  index: number;
  onChange: (b: NoteBlock) => void;
}) {
  const tokens = richViTokens(block.text);
  const sounds = block.sounds ?? {};
  return (
    <>
      <LocalizedInput
        multiline
        value={block.text}
        placeholder="The letter [ă] is short, like in [ăn] (to eat). Say it **quickly**."
        onChange={(text) => {
          // Keep only the recordings of the [bits] still in the text.
          const keep = new Set(richViTokens(text));
          const next = Object.fromEntries(Object.entries(sounds).filter(([vi]) => keep.has(vi)));
          onChange({ ...block, text, sounds: next });
        }}
      />
      <p className="t-caption c-muted">
        **gras** · [mot vietnamien] : cliquable dans l’app s’il a un audio.
      </p>
      {tokens.map((vi) => (
        <AudioField
          key={`${index}-${vi}`}
          value={sounds[vi]}
          name={vi}
          label={vi}
          onChange={(url) => {
            const next = { ...sounds };
            if (url) next[vi] = url;
            else delete next[vi];
            onChange({ ...block, sounds: next });
          }}
        />
      ))}
    </>
  );
}

/** Grid of tappable sounds (letters, tones, syllables). */
function SoundsEditor({
  items,
  onChange,
}: {
  items: NoteSound[];
  onChange: (items: NoteSound[]) => void;
}) {
  const set = (i: number, patch: Partial<NoteSound>) =>
    onChange(items.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="stack-sm">
      {items.map((s, i) => (
        <div key={i} className="note-sound">
          <input
            className="input input-vi"
            value={s.vi}
            placeholder="ă"
            onChange={(e) => set(i, { vi: e.target.value })}
          />
          <LocalizedInput
            value={s.caption ?? {}}
            placeholder="as in «ăn»"
            onChange={(caption) => set(i, { caption })}
          />
          <AudioField
            value={s.audio_url}
            name={s.vi || 'son'}
            label=""
            onChange={(audio_url) => set(i, { audio_url })}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Retirer le son"
            onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <X size={14} />
          </Button>
        </div>
      ))}
      <button
        type="button"
        className="add-line"
        onClick={() => onChange([...items, { vi: '', audio_url: null }])}>
        <Plus size={16} /> Ajouter un son
      </button>
    </div>
  );
}
