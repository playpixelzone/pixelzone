import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabaseUrl = '';
let supabaseAnonKey = '';

if (typeof import.meta !== 'undefined' && import.meta.env) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

/* Ohne gesetzte VITE_* (z. B. nur statische HTML-Datei): gleiche Defaults wie public/auth.js */
if (!supabaseUrl) supabaseUrl = 'https://mgvcxszzhxrvftqnizjm.supabase.co';
if (!supabaseAnonKey) {
  supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndmN4c3p6aHhydmZ0cW5pemptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjYzMjIsImV4cCI6MjA5MDM0MjMyMn0.ccuwZQxMyuJC69i4rzFE2FyxvhcHQdAC5T9w0HhD2bg';
}

/** @type {import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').SupabaseClient | null} */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function getSupabaseClient() {
  return supabase;
}

/**
 * Tabelle: public.user_progress (siehe scripts/supabase-user-progress.sql)
 * @returns {Promise<{ userId: string } | null>}
 */
export async function getCurrentUserId() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const {
    data: { session },
  } = await sb.auth.getSession();
  return session?.user?.id ? { userId: session.user.id } : null;
}

/**
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function fetchUserProgress(userId) {
  const sb = getSupabaseClient();
  if (!sb) return null;
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
  if (!sb) return false;
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
