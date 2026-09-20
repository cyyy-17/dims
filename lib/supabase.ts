import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;
let cachedKey: string = '';

export function isSupabaseConfigured(): boolean {
  let url = defaultSupabaseUrl;
  let key = defaultSupabaseAnonKey;

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('dims_supabase_url');
    const customKey = localStorage.getItem('dims_supabase_anon_key');
    if (customUrl && !customUrl.includes('placeholder')) url = customUrl;
    if (customKey && !customKey.includes('placeholder')) key = customKey;
  }

  return Boolean(
    url &&
      key &&
      !url.includes('placeholder') &&
      !key.includes('placeholder') &&
      url.startsWith('https://')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  let url = defaultSupabaseUrl;
  let key = defaultSupabaseAnonKey;

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('dims_supabase_url');
    const customKey = localStorage.getItem('dims_supabase_anon_key');
    if (customUrl && !customUrl.includes('placeholder')) url = customUrl;
    if (customKey && !customKey.includes('placeholder')) key = customKey;
  }

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder') || !url.startsWith('https://')) {
    return null;
  }

  const currentCacheKey = `${url}:${key}`;
  if (cachedClient && cachedKey === currentCacheKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    cachedKey = currentCacheKey;
    return cachedClient;
  } catch (err) {
    console.warn('Supabase client instantiation notice:', err);
    return null;
  }
}
