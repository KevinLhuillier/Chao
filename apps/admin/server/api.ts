import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type {
  ActivityDraft,
  LessonInput,
  ServerStatus,
  UnitInput,
  WordInput,
} from '../shared/api.js';
import { me, requireAdmin, signIn, signOut } from './auth.js';
import {
  createLesson,
  createUnit,
  createWord,
  deleteLesson,
  deleteUnit,
  deleteWord,
  getCourse,
  getLesson,
  listWords,
  reorderLessons,
  reorderUnits,
  setActivities,
  setLessonWords,
  updateLesson,
  updateUnit,
  updateWord,
  uploadAudio,
} from './content.js';
import { HttpError, db } from './db.js';

export const api = new Hono().basePath('/api');

api.onError((e, c) => {
  if (e instanceof HttpError) return c.json({ error: e.message }, e.status);
  if (e instanceof HTTPException) return c.json({ error: e.message }, e.status);
  console.error(e);
  return c.json({ error: e instanceof Error ? e.message : String(e) }, 500);
});

api.get('/status', (c) => c.json<ServerStatus>({ supabase: !!db() }));

api.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email?.trim() || !password) throw new HttpError(400, 'Email et mot de passe requis.');
  return c.json(await signIn(c, email.trim(), password));
});

api.post('/auth/logout', async (c) => {
  await signOut(c);
  return c.body(null, 204);
});

api.get('/auth/me', async (c) => c.json(await me(c)));

/** Everything below needs a signed-in admin. */
const PUBLIC = new Set(['/api/status', '/api/auth/login', '/api/auth/logout', '/api/auth/me']);
api.use('*', async (c, next) => {
  if (!PUBLIC.has(c.req.path)) await requireAdmin(c);
  await next();
});

const ids = async (c: { req: { json: <T>() => Promise<T> } }) => {
  const { ids } = await c.req.json<{ ids: string[] }>();
  if (!Array.isArray(ids)) throw new HttpError(400, 'Liste d’identifiants attendue.');
  return ids;
};

// --- Course -------------------------------------------------------------------

api.get('/course', async (c) => c.json(await getCourse()));

api.post('/units', async (c) => c.json(await createUnit(await c.req.json<UnitInput>()), 201));
api.put('/units/:id', async (c) =>
  c.json(await updateUnit(c.req.param('id'), await c.req.json<Partial<UnitInput>>())),
);
api.delete('/units/:id', async (c) => {
  await deleteUnit(c.req.param('id'));
  return c.body(null, 204);
});
api.post('/units/reorder', async (c) => {
  await reorderUnits(await ids(c));
  return c.body(null, 204);
});

api.post('/units/:id/lessons', async (c) => {
  const { title } = await c.req.json<{ title: string }>();
  return c.json(await createLesson(c.req.param('id'), title ?? ''), 201);
});
api.post('/units/:id/lessons/reorder', async (c) => {
  await reorderLessons(await ids(c));
  return c.body(null, 204);
});

// --- Lessons ------------------------------------------------------------------

api.get('/lessons/:id', async (c) => c.json(await getLesson(c.req.param('id'))));
api.put('/lessons/:id', async (c) =>
  c.json(await updateLesson(c.req.param('id'), await c.req.json<Partial<LessonInput>>())),
);
api.delete('/lessons/:id', async (c) => {
  await deleteLesson(c.req.param('id'));
  return c.body(null, 204);
});

/** Saves the whole lesson at once: words (ordered) and activities (ordered). */
api.put('/lessons/:id/content', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ word_ids: string[]; activities: ActivityDraft[] }>();
  if (!Array.isArray(body.word_ids) || !Array.isArray(body.activities)) {
    throw new HttpError(400, 'Contenu de leçon invalide.');
  }
  await setLessonWords(id, body.word_ids);
  await setActivities(id, body.activities);
  return c.json(await getLesson(id));
});

// --- Words --------------------------------------------------------------------

api.get('/words', async (c) => c.json(await listWords()));
api.post('/words', async (c) => c.json(await createWord(await c.req.json<WordInput>()), 201));
api.put('/words/:id', async (c) =>
  c.json(await updateWord(c.req.param('id'), await c.req.json<Partial<WordInput>>())),
);
api.delete('/words/:id', async (c) => {
  await deleteWord(c.req.param('id'));
  return c.body(null, 204);
});

// --- Recordings -----------------------------------------------------------------

api.post('/audio', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) throw new HttpError(400, 'Aucun fichier audio reçu.');
  const name = typeof body.name === 'string' ? body.name : '';
  return c.json({ url: await uploadAudio(name, file) });
});
