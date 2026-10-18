import type { LessonRow, UnitRow, WordRow } from '@chao/shared';

import type {
  ActivityDraft,
  AdminUser,
  ApiError,
  CourseUnit,
  LessonDetail,
  LessonInput,
  ServerStatus,
  UnitInput,
  WordInput,
} from '../../shared/api';

/** Called when the session is gone (expired, signed out elsewhere, admin revoked). */
let onSignedOut: () => void = () => {};
export const setSignedOutHandler = (fn: () => void) => (onSignedOut = fn);

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(`/api${url}`, init);
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({ error: res.statusText }))) as T | ApiError;
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && !url.startsWith('/auth/')) onSignedOut();
    throw new Error((data as ApiError).error ?? res.statusText);
  }
  return data as T;
}

export const api = {
  status: () => request<ServerStatus>('GET', '/status'),
  me: () => request<AdminUser>('GET', '/auth/me'),
  signIn: (email: string, password: string) =>
    request<AdminUser>('POST', '/auth/login', { email, password }),
  signOut: () => request<void>('POST', '/auth/logout'),

  course: () => request<CourseUnit[]>('GET', '/course'),
  createUnit: (input: UnitInput) => request<UnitRow>('POST', '/units', input),
  updateUnit: (id: string, input: Partial<UnitInput>) =>
    request<UnitRow>('PUT', `/units/${id}`, input),
  deleteUnit: (id: string) => request<void>('DELETE', `/units/${id}`),
  reorderUnits: (ids: string[]) => request<void>('POST', '/units/reorder', { ids }),

  createLesson: (unitId: string, title: string) =>
    request<LessonRow>('POST', `/units/${unitId}/lessons`, { title }),
  reorderLessons: (unitId: string, ids: string[]) =>
    request<void>('POST', `/units/${unitId}/lessons/reorder`, { ids }),
  lesson: (id: string) => request<LessonDetail>('GET', `/lessons/${id}`),
  updateLesson: (id: string, input: Partial<LessonInput>) =>
    request<LessonRow>('PUT', `/lessons/${id}`, input),
  deleteLesson: (id: string) => request<void>('DELETE', `/lessons/${id}`),
  saveLessonContent: (id: string, wordIds: string[], activities: ActivityDraft[]) =>
    request<LessonDetail>('PUT', `/lessons/${id}/content`, { word_ids: wordIds, activities }),

  words: () => request<WordRow[]>('GET', '/words'),
  createWord: (input: WordInput) => request<WordRow>('POST', '/words', input),
  updateWord: (id: string, input: Partial<WordInput>) =>
    request<WordRow>('PUT', `/words/${id}`, input),
  deleteWord: (id: string) => request<void>('DELETE', `/words/${id}`),

  uploadAudio: (name: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    return request<{ url: string }>('POST', '/audio', form);
  },
};
