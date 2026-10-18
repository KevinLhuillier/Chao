import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root (apps/admin/server → ../../..). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

config({ path: path.join(REPO_ROOT, '.env'), quiet: true });

export class HttpError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503,
    message: string,
  ) {
    super(message);
  }
}

/** Service-role client: bypasses RLS. Only ever used on this machine. */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env at the repo root and fill it in.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Supabase client, or null when the .env has no keys. */
export function db(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  cached ??= adminClient();
  return cached;
}
let cached: SupabaseClient | undefined;

export function requireDb(): SupabaseClient {
  const client = db();
  if (!client) {
    throw new HttpError(
      503,
      'Supabase n’est pas configuré : renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans le .env à la racine.',
    );
  }
  return client;
}

/** Throws on Supabase errors, with what was being done. */
export function check<T>(
  res: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (res.error) throw new HttpError(500, `${what} : ${res.error.message}`);
  return res.data as T;
}
