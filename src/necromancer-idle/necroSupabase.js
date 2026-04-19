import { createClient } from '@supabase/supabase-js';

/**
 * Supabase-Client (Vite: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Fallback: gleiche Werte wie public/auth.js für lokale Builds ohne .env
 */
const url =
  import.meta.env.VITE_SUPABASE_URL || 'https://mgvcxszzhxrvftqnizjm.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndmN4c3p6aHhydmZ0cW5pemptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjYzMjIsImV4cCI6MjA5MDM0MjMyMn0.ccuwZQxMyuJC69i4rzFE2FyxvhcHQdAC5T9w0HhD2bg';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/**
 * Tabelle: public.user_progress (siehe scripts/supabase-user-progress.sql)
 * @returns {Promise<{ userId: string } | null>}
 */
export async function getCurrentUserId() {
  const sb = getSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  return session?.user?.id ? { userId: session.user.id } : null;
}

/**
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function fetchUserProgress(userId) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Necro] Supabase fetch user_progress', error.message);
    return null;
  }
  return data;
}

/**
 * @param {string} userId
 * @param {object} row — Felder wie in user_progress
 */
export async function upsertUserProgress(userId, row) {
  const sb = getSupabaseClient();
  const payload = {
    user_id: userId,
    ...row,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from('user_progress').upsert(payload, {
    onConflict: 'user_id',
  });
  if (error && row && typeof row === 'object' && 'save_version' in row) {
    const msg = String(error.message || '');
    if (/save_version|schema cache|column/i.test(msg)) {
      const { save_version: _sv, ...rest } = row;
      const { error: err2 } = await sb
        .from('user_progress')
        .upsert(
          { user_id: userId, ...rest, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (!err2) return true;
    }
  }
  if (error) {
    console.warn('[Necro] Supabase upsert user_progress', error.message);
    return false;
  }
  return true;
}
