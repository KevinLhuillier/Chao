import { Mic, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { api } from '../lib/api';
import { Button, useToast } from './ui';

/**
 * A recording (word or sentence): play it, upload / replace an MP3 or M4A
 * (public "audio" Storage bucket), or remove it. Recorded voices only: the app
 * never uses the microphone.
 */
export function AudioField({
  value,
  name,
  onChange,
  label = 'Audio',
}: {
  value: string | null | undefined;
  /** Used to name the uploaded file. */
  name: string;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function upload(file: File) {
    setBusy(true);
    try {
      const { url } = await api.uploadAudio(name, file);
      onChange(url);
      toast('Audio envoyé.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="audio-field">
      <span className="audio-label">
        <Mic size={16} /> {label}
      </span>
      {value ? (
        <audio src={value} controls preload="none" />
      ) : (
        <span className="c-muted t-caption grow">Aucun enregistrement</span>
      )}
      <input
        ref={input}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        icon={<Upload size={16} />}
        onClick={() => input.current?.click()}>
        {value ? 'Remplacer' : 'Envoyer'}
      </Button>
      {value ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retirer l’audio"
          title="Retirer l’audio"
          onClick={() => onChange(null)}>
          <Trash2 size={16} />
        </Button>
      ) : null}
    </div>
  );
}
