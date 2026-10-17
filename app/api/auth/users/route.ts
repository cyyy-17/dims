import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Helper: Ensure the caller is an authenticated Super Admin (Fail-Closed)
async function verifySuperAdmin(request: NextRequest): Promise<{ error?: string; status?: number; session?: { email: string } }> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = verifySessionToken(sessionCookie?.value);
  if (!session || !session.valid || !session.email) {
    return { error: 'Unauthorized session. Please log in.', status: 401 };
  }

  const callerEmail = session.email.toLowerCase();
  const leadStaffEmail = (process.env.DIMS_STAFF_EMAIL || 'aseanresidences@firstasia.edu.ph').toLowerCase();

  // If primary offline staff email, grant super admin
  if (callerEmail === leadStaffEmail) {
    return { session: { email: callerEmail } };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { error: 'Forbidden. Super Admin access required.', status: 403 };
  }

  try {
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError || !usersData?.users) {
      return { error: 'Authorization verification failed.', status: 403 };
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === callerEmail || u.id === callerEmail
    );

    if (!user) {
      return { error: 'Forbidden. Account not recognized as Super Admin.', status: 403 };
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'super_admin') {
      return { error: 'Forbidden. Super Admin access required.', status: 403 };
    }

    return { session: { email: callerEmail } };
  } catch {
    return { error: 'Forbidden. Authorization error.', status: 403 };
  }
}

// GET: Retrieve list of all staff accounts
export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if ('error' in authCheck) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data: profiles } = await admin
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: authUsers } = await admin.auth.admin.listUsers();

        if (profiles && profiles.length > 0) {
          const staffUsers = profiles.map((p) => {
            const authUser = authUsers?.users?.find((u) => u.id === p.id);
            return {
              id: p.id,
              fullName: p.full_name,
              email: authUser?.email || '',
              role: p.role,
              designation: p.designation || 'ASR Staff',
              isActive: p.is_active ?? true,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
            };
          });

          return NextResponse.json({ success: true, users: staffUsers });
        }
      } catch (err) {
        console.warn('Supabase users listing fallback:', err);
      }
    }

    return NextResponse.json({
      success: true,
      users: [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve staff users.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: Provision a new staff user account
export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if ('error' in authCheck) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { email, password, fullName, role, designation } = body || {};

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, role, and temporary password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    let newUserId = '';

    if (admin) {
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          designation: designation || 'ASR Staff',
        },
      });

      if (createErr) {
        return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
      }

      newUserId = newUser.user.id;

      // Insert into user_profiles
      await admin.from('user_profiles').upsert({
        id: newUserId,
        full_name: fullName,
        role,
        designation: designation || 'ASR Staff',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Staff member ${fullName} (${role}) provisioned successfully.`,
      user: {
        id: newUserId,
        fullName,
        email,
        role,
        designation: designation || 'ASR Staff',
        isActive: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to provision staff account.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH: Update staff user role, designation, active status, or reset password
export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if ('error' in authCheck) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { id, fullName, role, designation, isActive, newPassword, email } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    // Protection: Super admin cannot deactivate themselves
    const callerEmail = authCheck.session?.email || '';
    if (email && email.toLowerCase() === callerEmail.toLowerCase() && isActive === false) {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate your own Super Admin account.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      const updatePayload: Record<string, string | boolean> = {
        updated_at: new Date().toISOString(),
      };
      if (fullName !== undefined && fullName.trim()) updatePayload.full_name = fullName.trim();
      if (role !== undefined) updatePayload.role = role;
      if (designation !== undefined) updatePayload.designation = designation;
      if (isActive !== undefined) updatePayload.is_active = isActive;

      await admin.from('user_profiles').update(updatePayload).eq('id', id);

      // Keep auth.users metadata in sync
      const metaUpdates: Record<string, string> = {};
      if (fullName !== undefined && fullName.trim()) metaUpdates.full_name = fullName.trim();
      if (designation !== undefined) metaUpdates.designation = designation;
      if (role !== undefined) metaUpdates.role = role;

      if (Object.keys(metaUpdates).length > 0) {
        try {
          await admin.auth.admin.updateUserById(id, { user_metadata: metaUpdates });
        } catch (mErr) {
          console.warn('Auth user metadata update notice:', mErr);
        }
      }

      // Handle password reset if requested
      if (newPassword) {
        if (newPassword.length < 8) {
          return NextResponse.json(
            { success: false, error: 'Reset password must be at least 8 characters long.' },
            { status: 400 }
          );
        }
        const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password: newPassword });
        if (pwErr) {
          return NextResponse.json({ success: false, error: pwErr.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Staff user profile and permissions updated.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update staff user.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE: Deactivate or remove staff user account
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if ('error' in authCheck) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const targetEmail = searchParams.get('email');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const callerEmail = authCheck.session?.email || '';
    if (
      (targetEmail && targetEmail.toLowerCase() === callerEmail.toLowerCase()) ||
      id === callerEmail
    ) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own Super Admin account.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.auth.admin.deleteUser(id);
        await admin.from('user_profiles').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete user notice:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Staff account removed successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete staff user.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
