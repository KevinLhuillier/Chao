import { currentUserId, supabase, unwrap } from '../supabase';
import type { Profile } from '../types';

export async function fetchProfile(): Promise<Profile | null> {
  const userId = await currentUserId();
  return unwrap(
    await supabase.from('profiles').select('username, ui_lang').eq('user_id', userId).maybeSingle(),
  ) as Profile | null;
}
