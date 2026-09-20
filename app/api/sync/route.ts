import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Server-side Supabase admin client using Service Role Key
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const ALLOWED_SYNC_TABLES = new Set([
  'rooms',
  'bed_slots',
  'dormers',
  'room_assignments',
  'categories',
  'items',
  'stock_transactions',
  'room_inventory',
  'visitor_logs',
  'announcements',
  'announcement_recipients',
  'activity_logs',
]);

export interface SyncMutation {
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT' | 'ASSIGN_BED' | 'CHECKOUT_DORMER' | 'TRANSFER_BED';
  table: string;
  payload: any;
}

export async function POST(request: NextRequest) {
  // 1. Session verification with cryptographic HMAC signature
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = verifySessionToken(sessionCookie?.value);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid staff session required.' },
      { status: 401 }
    );
  }

  const supabase: any = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase credentials not configured on server.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const mutations: SyncMutation[] = Array.isArray(body.mutations)
      ? body.mutations
      : [body];

    const results = [];

    for (const mutation of mutations) {
      const { action, table, payload } = mutation;

      if (action === 'CHECKOUT_DORMER') {
        const { dormerId, bedSlotId } = payload;
        // 1. Deactivate room assignment
        if (dormerId) {
          await supabase
            .from('room_assignments')
            .update({ is_current: false, check_out_date: new Date().toISOString().split('T')[0] })
            .eq('dormer_id', dormerId)
            .eq('is_current', true);
        }
        // 2. Free up bed slot
        if (bedSlotId) {
          await supabase.from('bed_slots').update({ is_occupied: false }).eq('id', bedSlotId);
        }
        // 3. Update dormer status
        if (dormerId) {
          await supabase.from('dormers').update({ status: 'checked_out' }).eq('id', dormerId);
        }
        results.push({ action, success: true });
      } else if (action === 'ASSIGN_BED') {
        const { dormerId, roomId, bedSlotId, checkInDate } = payload;
        // 1. Free any prior active bed slot of this dormer
        const { data: priorAsgs } = await supabase
          .from('room_assignments')
          .select('bed_slot_id')
          .eq('dormer_id', dormerId)
          .eq('is_current', true);

        if (priorAsgs && priorAsgs.length > 0) {
          for (const p of priorAsgs) {
            if (p.bed_slot_id) {
              await supabase.from('bed_slots').update({ is_occupied: false }).eq('id', p.bed_slot_id);
            }
          }
          await supabase
            .from('room_assignments')
            .update({ is_current: false, check_out_date: checkInDate })
            .eq('dormer_id', dormerId)
            .eq('is_current', true);
        }

        // 2. Insert new assignment
        await supabase.from('room_assignments').insert({
          dormer_id: dormerId,
          room_id: roomId,
          bed_slot_id: bedSlotId,
          check_in_date: checkInDate,
          is_current: true,
        });

        // 3. Mark bed slot occupied
        await supabase.from('bed_slots').update({ is_occupied: true }).eq('id', bedSlotId);

        // 4. Set dormer status active
        await supabase.from('dormers').update({ status: 'active' }).eq('id', dormerId);

        results.push({ action, success: true });
      } else if (action === 'TRANSFER_BED') {
        const { dormerId, oldBedSlotId, newRoomId, newBedSlotId, checkInDate } = payload;
        // 1. Free old bed
        if (oldBedSlotId) {
          await supabase.from('bed_slots').update({ is_occupied: false }).eq('id', oldBedSlotId);
        }
        // 2. End previous current assignment
        await supabase
          .from('room_assignments')
          .update({ is_current: false, check_out_date: checkInDate })
          .eq('dormer_id', dormerId)
          .eq('is_current', true);

        // 3. Create new assignment
        await supabase.from('room_assignments').insert({
          dormer_id: dormerId,
          room_id: newRoomId,
          bed_slot_id: newBedSlotId,
          check_in_date: checkInDate,
          is_current: true,
        });

        // 4. Mark new bed occupied
        await supabase.from('bed_slots').update({ is_occupied: true }).eq('id', newBedSlotId);

        results.push({ action, success: true });
      } else if (['INSERT', 'UPSERT', 'UPDATE', 'DELETE'].includes(action)) {
        // Table whitelist check
        if (!ALLOWED_SYNC_TABLES.has(table)) {
          results.push({
            action,
            table,
            success: false,
            error: `Table '${table}' is not permitted for synchronization.`,
          });
          continue;
        }

        if (action === 'INSERT') {
          const { error } = await supabase.from(table).insert(payload);
          results.push({ action, table, success: !error, error: error?.message });
        } else if (action === 'UPSERT') {
          const { error } = await supabase.from(table).upsert(payload);
          results.push({ action, table, success: !error, error: error?.message });
        } else if (action === 'UPDATE') {
          const { error } = await supabase.from(table).update(payload.data).eq('id', payload.id);
          results.push({ action, table, success: !error, error: error?.message });
        } else if (action === 'DELETE') {
          const { error } = await supabase.from(table).delete().eq('id', payload.id);
          results.push({ action, table, success: !error, error: error?.message });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync execution error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Session verification with cryptographic HMAC signature
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = verifySessionToken(sessionCookie?.value);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid staff session required.' },
      { status: 401 }
    );
  }

  const supabase: any = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase credentials not configured on server.' },
      { status: 500 }
    );
  }

  try {
    const [
      { data: rooms },
      { data: bedSlots },
      { data: dormers },
      { data: assignments },
      { data: categories },
      { data: items },
      { data: stockTransactions },
      { data: roomInventory },
      { data: visitorLogs },
      { data: announcements },
      { data: activityLogs },
    ] = await Promise.all([
      supabase.from('rooms').select('*'),
      supabase.from('bed_slots').select('*'),
      supabase.from('dormers').select('*'),
      supabase.from('room_assignments').select('*').eq('is_current', true),
      supabase.from('categories').select('*'),
      supabase.from('items').select('*'),
      supabase.from('stock_transactions').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('room_inventory').select('*'),
      supabase.from('visitor_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms || [],
        bedSlots: bedSlots || [],
        dormers: dormers || [],
        assignments: assignments || [],
        categories: categories || [],
        items: items || [],
        stockTransactions: stockTransactions || [],
        roomInventory: roomInventory || [],
        visitorLogs: visitorLogs || [],
        announcements: announcements || [],
        activityLogs: activityLogs || [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve cloud sync data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
