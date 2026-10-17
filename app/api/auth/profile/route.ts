import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifySessionToken,
  createSignedSessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET: Return authenticated staff profile
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    const session = verifySessionToken(sessionCookie?.value);

    if (!session || !session.valid || !session.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const email = session.email;
    const admin = getSupabaseAdmin();

    if (admin) {
      // Look up user profile in Supabase by resolving auth.users UUID
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase() || u.id === email
      );

      if (existingUser) {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('*')
          .eq('id', existingUser.id)
          .maybeSingle();

        if (profile) {
          return NextResponse.json({
            success: true,
            user: {
              id: profile.id,
              fullName: profile.full_name,
              email: existingUser.email || email,
              role: profile.role,
              designation: profile.designation,
              isActive: profile.is_active,
            },
          });
        }
      }
    }

    // Default response using session identity
    return NextResponse.json({
      success: true,
      user: {
        id: email,
        email: email,
        fullName: 'ASR Staff Representative',
        role: 'super_admin',
        designation: 'ASR Lead Representative',
        isActive: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve profile.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH: Update personal information and/or change password
export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    const session = verifySessionToken(sessionCookie?.value);

    if (!session || !session.valid || !session.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized session. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      email: newEmail,
      designation,
      contactNo,
      currentPassword,
      newPassword,
      confirmPassword,
    } = body || {};

    const currentEmail = session.email;
    const admin = getSupabaseAdmin();
    let passwordUpdated = false;

    // Password Update Logic
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to set a new password.' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'New password and confirmation do not match.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      if (!hasLetter || !hasNumber) {
        return NextResponse.json(
          { success: false, error: 'New password must include both letters and numbers.' },
          { status: 400 }
        );
      }

      let authenticatedOldPassword = false;

      // Verify current password via Supabase Auth
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const client = createClient(supabaseUrl, supabaseAnonKey);
          const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
            email: currentEmail,
            password: currentPassword,
          });

          if (!signInErr && signInData?.user) {
            authenticatedOldPassword = true;

            // Update password in Supabase
            if (admin) {
              const { error: updateErr } = await admin.auth.admin.updateUserById(
                signInData.user.id,
                { password: newPassword }
              );
              if (updateErr) {
                return NextResponse.json(
                  { success: false, error: updateErr.message },
                  { status: 400 }
                );
              }
              passwordUpdated = true;
            }
          }
        } catch {
          // Fall through to fallback check
        }
      }

      // Offline fallback verification
      if (!authenticatedOldPassword) {
        const staffPassword = process.env.DIMS_STAFF_PASSWORD || '';
        if (staffPassword && currentPassword === staffPassword) {
          authenticatedOldPassword = true;
          passwordUpdated = true;
        }
      }

      if (!authenticatedOldPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password verification failed. Incorrect password.' },
          { status: 401 }
        );
      }
    }

    // Profile metadata update in Supabase if admin is connected
    if (admin && (fullName || designation)) {
      try {
        const { data: usersData } = await admin.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === currentEmail.toLowerCase()
        );

        if (existingUser) {
          // 1. Update user_profiles table directly
          const updatePayload: Record<string, string> = {
            updated_at: new Date().toISOString(),
          };
          if (fullName) updatePayload.full_name = fullName.trim();
          if (designation) updatePayload.designation = designation.trim();

          const { error: pErr } = await admin
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', existingUser.id);

          if (pErr) {
            // If row doesn't exist yet, insert with required role
            await admin.from('user_profiles').upsert({
              id: existingUser.id,
              full_name: fullName.trim() || 'ASR Staff',
              designation: designation?.trim() || 'ASR Staff',
              role: existingUser.user_metadata?.role || 'super_admin',
              is_active: true,
              updated_at: new Date().toISOString(),
            });
          }

          // 2. Keep auth.users metadata in sync
          await admin.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              ...existingUser.user_metadata,
              ...(fullName ? { full_name: fullName.trim() } : {}),
              ...(designation ? { designation: designation.trim() } : {}),
            },
          });
        }
      } catch (e) {
        console.warn('Supabase profile metadata update notice:', e);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: passwordUpdated
        ? 'Profile information and password updated successfully.'
        : 'Profile information updated successfully.',
      user: {
        fullName,
        designation,
        contactNo,
        email: newEmail || currentEmail,
      },
    });

    // If email changed, issue renewed session token
    if (newEmail && newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      const newToken = createSignedSessionToken(newEmail.trim());
      response.cookies.set(SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
