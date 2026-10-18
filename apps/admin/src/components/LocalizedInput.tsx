import { CONTENT_LANGS, LANG_NAMES, type Lang, type LocalizedText } from '@chao/shared';

/**
 * One input per content language (only English today). Adding 'fr' to
 * CONTENT_LANGS (packages/shared) adds a French input everywhere.
 */
export function LocalizedInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const many = CONTENT_LANGS.length > 1;
  return (
    <div className="stack-sm">
      {CONTENT_LANGS.map((lang: Lang) => {
        const props = {
          className: 'input',
          value: value[lang] ?? '',
          placeholder: many ? `${placeholder ?? ''} (${LANG_NAMES[lang]})` : placeholder,
          onChange: (e: { target: { value: string } }) =>
            onChange({ ...value, [lang]: e.target.value }),
        };
        return (
          <div key={lang} className={many ? 'lang-row' : undefined}>
            {many ? <span className="lang-tag">{lang}</span> : null}
            {multiline ? <textarea rows={2} {...props} /> : <input {...props} />}
          </div>
        );
      })}
    </div>
  );
}

/** Comma-separated list ↔ string[] (alternative answers, extra tiles). */
export const toList = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
export const fromList = (list: string[] | undefined) => (list ?? []).join(', ');
