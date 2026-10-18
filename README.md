# Chào

Learn Vietnamese — the way the South speaks it (Saigon, Mekong Delta). One single path down the
Mekong: a boat sails from lily pad to lily pad, each pad is a lesson.

Same stack as Fabl: Expo (SDK 57, expo-router) + Supabase, and a local web admin (Vite + React,
Hono API).

## Structure

```
apps/mobile          Expo app (TypeScript, expo-router)
  src/app            Screens: journey (river), words, profile, lesson, practice, celebration, sign-in
  src/components     River map (river/), lesson engine (lesson/), sheets, audio button…
  src/lib            Supabase, auth, gamification (XP/streak), API, exercise building
  src/i18n           Interface strings (English today; fr/es later)
  src/theme          Design system: Vietnam palette, typography, motion, base components
apps/admin           Local web admin to manage the whole course (units, lessons, words, activities, audio)
packages/shared      Content model shared by app & admin: types, answer checking, activity generator
supabase/migrations  SQL schema
```

## Run the app

```bash
npm install                                     # at the repo root (npm workspaces)
cp apps/mobile/.env.example apps/mobile/.env    # Supabase URL + publishable/anon key
npm run mobile                                  # scan the QR code with Expo Go
```

Sign up with a **username**, an email and a password.

### What's in the app

- **Journey**: one river, zigzagging down the screen. Units (themes) are lacquered signs with silk
  lanterns; each lesson is a lily pad — locked (grey), current (lotus bud, pulsing, with the boat
  arriving), done (lotus in bloom). Tap a pad to start or replay it.
- **Lessons**: sequences of activities — lesson cards (word, recording, meaning, Northern variant,
  tip, example), multiple choice both ways, listening + choice, typing both ways (missing tone
  marks are accepted as "almost"), dictation, matching pairs, rebuilding sentences from tiles.
  **No speaking exercise**: the app never uses the microphone. Missed exercises come back at the end.
- **Words & phrases**: everything taught by the completed lessons, grouped by theme, searchable
  with or without tone marks, with recordings; free **practice** on learned words.
- **XP & streak**: rules in `apps/mobile/src/lib/gamification.ts` (a day counts as soon as XP is
  earned), daily goal in the profile.

### Staying signed in

The Supabase session is stored on the device and refreshed automatically. Refresh tokens never
expire as long as the project has **no session time-box nor inactivity timeout** (dashboard →
Authentication → Sessions — the default), so learners stay signed in until they sign out. The admin
keeps its refresh token in a cookie renewed on every refresh (400 days, the browser maximum).

### Languages

The interface is in English (`apps/mobile/src/i18n/en.ts`). Learner-facing content is stored per
language (`{"en": "Hello"}`). To add French: create `src/i18n/fr.ts` (same shape, type-checked),
register it in `src/i18n/index.ts`, add `'fr'` to `CONTENT_LANGS` in `packages/shared` — the admin
then shows a French input next to each English one.

## Supabase

1. Create a project on [supabase.com](https://supabase.com) (separate from Fabl).
2. **Authentication → Providers → Email**: enabled. To sign up without a confirmation email
   (recommended), turn off **Confirm email**.
3. Apply the migration — `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   paste `supabase/migrations/*.sql` in the SQL Editor. It also creates the public **`audio`**
   Storage bucket (recordings, like Fabl's voice-overs).
4. Keys (**Project Settings → API**): `apps/mobile/.env` → URL + publishable key; `.env` (repo
   root) → URL + secret key (admin only, never in the app).

| Table                                                                      | Access                            |
| -------------------------------------------------------------------------- | --------------------------------- |
| `units`, `lessons` (published only), `words`, `lesson_words`, `activities` | public read, written by the admin |
| `profiles`, `user_lesson_progress`, `user_stats`, `xp_events`              | owner only (RLS on `auth.uid()`)  |

A profile (with the username) and a stats row are created automatically at sign-up.

## Content

```bash
npm run seed                 # starter course: 6 themes, 17 lessons, ~75 Southern words & phrases
npm run seed -- --force      # overwrite the seeded rows (recordings are kept)
```

### Admin

```bash
npm run grant-admin -- you@example.com   # once, after signing up in the app (--revoke to remove)
npm run admin                            # → http://localhost:5180
```

Sign in with an admin Chao account (`app_metadata.admin = true`, only settable with the secret key).
The server keeps the session in HttpOnly cookies and only listens on localhost.

- **Parcours**: units in river order (color, illustration, published or draft), their lessons;
  create, reorder, publish/hide, delete.
- **Lesson editor**: words taught by the lesson (they join the learner's vocabulary when the lesson
  is done) and its activities — add any type, edit, reorder, duplicate, or **generate** a full
  sequence from the lesson's words. Activities needing a recording fall back to a non-audio version
  in the app until one is uploaded. `Ctrl+S` saves.
- **Vocabulaire**: the word bank by theme — Vietnamese, translation and accepted alternatives,
  Northern equivalent, tip, example sentence, and **recordings** (MP3/M4A uploaded to the `audio`
  bucket, for the word and its example). Filter "sans audio" to see what is left to record.

## Scripts

| Command                          | What it does                             |
| -------------------------------- | ---------------------------------------- |
| `npm run mobile`                 | Start the Expo dev server                |
| `npm run admin`                  | Start the web admin (localhost:5180)     |
| `npm run grant-admin -- <email>` | Give admin access (`--revoke` to remove) |
| `npm run seed`                   | Load the starter course                  |
| `npm run lint`                   | ESLint on the app                        |
| `npm run typecheck`              | TypeScript on all packages               |
| `npm run format`                 | Format the whole repo                    |
