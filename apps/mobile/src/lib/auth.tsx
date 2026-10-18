import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { t } from '@/i18n';

import { supabase } from './supabase';

type AuthContextValue = {
  session: Session | null;
  /** False until the stored session has been restored. */
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, ready }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const USERNAME = /^[A-Za-z0-9_.]{3,20}$/;

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_available', { name: username });
  if (error) throw new Error(error.message);
  return data === true;
}

/** Supabase auth errors, in the interface language. */
export function authErrorMessage(message: string): string {
  const e = t.auth.errors;
  if (/invalid login credentials/i.test(message)) return e.invalidCredentials;
  if (/email not confirmed/i.test(message)) return e.emailNotConfirmed;
  if (/already registered/i.test(message)) return e.alreadyRegistered;
  if (/password should be at least/i.test(message)) return e.passwordTooShort;
  if (/valid email|invalid format/i.test(message)) return e.invalidEmail;
  // The signup trigger fails when the username was taken in the meantime.
  if (/database error saving new user/i.test(message)) return e.usernameTaken;
  return message;
}
