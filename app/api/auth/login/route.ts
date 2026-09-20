import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSignedSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required.' },
        { status: 400 }
      );
    }

    let authenticated = false;

    // Step 1: Try Supabase auth (primary)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (!error && data?.session) {
          authenticated = true;
        }
      } catch {
        // Continue to fallback if Supabase network/auth fails
      }
    }

    // Step 2: Offline fallback — compare against server-only env vars
    // DIMS_STAFF_EMAIL and DIMS_STAFF_PASSWORD are set only in .env.local / Vercel env (never NEXT_PUBLIC_)
    if (!authenticated) {
      const staffEmail = process.env.DIMS_STAFF_EMAIL || '';
      const staffPassword = process.env.DIMS_STAFF_PASSWORD || '';
      if (
        staffEmail &&
        staffPassword &&
        email.trim().toLowerCase() === staffEmail.toLowerCase() &&
        password === staffPassword
      ) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff credentials.' },
        { status: 401 }
      );
    }

    // Generate cryptographically signed session token (HMAC-SHA256 with timestamp)
    const token = createSignedSessionToken(email.trim());

    const response = NextResponse.json({ success: true });
    // Set HttpOnly cookie — not readable by JavaScript, immune to XSS
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
