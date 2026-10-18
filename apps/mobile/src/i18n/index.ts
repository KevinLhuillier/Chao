import type { Lang } from '@chao/shared';

import { en, type Messages } from './en';

/**
 * Interface strings per language. To add French: create `fr.ts` exporting a
 * `Messages` object, register it here and add 'fr' to CONTENT_LANGS (shared)
 * once the course content is translated.
 */
const messages: Partial<Record<Lang, Messages>> = { en };

/** Learner language. Fixed to English for now; will come from the profile (`ui_lang`). */
export const LANG: Lang = 'en';

export const availableLangs = Object.keys(messages) as Lang[];

export const t: Messages = messages[LANG] ?? en;
