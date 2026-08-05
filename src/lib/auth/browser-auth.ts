import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Ayudantes de autenticación del NAVEGADOR (Supabase Auth).
 * Usa el cliente browser (publishable + RLS), nunca el service role.
 */
export async function getSession() {
  const supabase = getSupabaseBrowserClient();
  return (await supabase.auth.getSession()).data.session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}

/** Email del usuario autenticado, o null. */
export async function getSessionEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email?.toLowerCase() ?? null;
}
