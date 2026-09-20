import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  // Sign out of Supabase if connected
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  } catch {
    // ignore
  }

  const response = NextResponse.json({ success: true });
  // Clear the HttpOnly session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
