import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: any = null;

export function getSupabaseClient(): any {
  let url = defaultSupabaseUrl;
  let key = defaultSupabaseAnonKey;

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('dims_supabase_url');
    const customKey = localStorage.getItem('dims_supabase_anon_key');
    if (customUrl && !customUrl.includes('placeholder')) url = customUrl;
    if (customKey && !customKey.includes('placeholder')) key = customKey;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}

export const isSupabaseConfigured = () => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('dims_supabase_url');
    const customKey = localStorage.getItem('dims_supabase_anon_key');
    if (customUrl && customKey && !customUrl.includes('placeholder')) {
      return true;
    }
  }
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
  );
};
