/** Types exchanged between the admin server (server/) and the web app (src/). */
import type {
  ActivityPayload,
  LessonRow,
  LocalizedList,
  LocalizedText,
  UnitColor,
  UnitIcon,
  UnitRow,
  WordKind,
  WordRow,
} from '@chao/shared';

export type LessonSummary = LessonRow & { word_count: number; activity_count: number };

export type CourseUnit = UnitRow & { lessons: LessonSummary[]; word_count: number };

/** An activity as edited in the admin (id absent until saved). */
export type ActivityDraft = ActivityPayload & { id?: string };

export type LessonDetail = {
  lesson: LessonRow;
  unit: UnitRow;
  /** Words taught by the lesson, in order. */
  words: WordRow[];
  activities: ActivityDraft[];
};

export type UnitInput = {
  title: LocalizedText;
  description: LocalizedText;
  color: UnitColor;
  icon: UnitIcon;
  published: boolean;
};

export type LessonInput = { title: LocalizedText; published: boolean; unit_id: string };

export type WordInput = {
  unit_id: string | null;
  vi: string;
  meaning: LocalizedText;
  alternatives: LocalizedList;
  kind: WordKind;
  north: string | null;
  note: LocalizedText;
  example_vi: string | null;
  example_meaning: LocalizedText;
  audio_url: string | null;
  example_audio_url: string | null;
};

export type ServerStatus = {
  /** Supabase keys found in the repo's .env. */
  supabase: boolean;
};

/** Signed-in admin (Chao account with app_metadata.admin = true). */
export type AdminUser = { id: string; email: string };

export type ApiError = { error: string };
