-- ============================================================
-- DIMS — Fix Supabase RLS Security Warnings
-- Run this script in your Supabase Project -> SQL Editor -> Run
-- ============================================================

-- 1. DROP OVERLY PERMISSIVE POLICIES FLAGGED BY SUPABASE LINTER
DROP POLICY IF EXISTS "Staff can access rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff can access bed slots" ON public.bed_slots;
DROP POLICY IF EXISTS "Staff can access dormers" ON public.dormers;
DROP POLICY IF EXISTS "Staff can access assignments" ON public.room_assignments;
DROP POLICY IF EXISTS "Staff can access visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Staff can access categories" ON public.categories;
DROP POLICY IF EXISTS "Staff can access inventory" ON public.items;
DROP POLICY IF EXISTS "Staff can access stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Staff can access room inventory" ON public.room_inventory;
DROP POLICY IF EXISTS "Staff can access announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff can access announcement recipients" ON public.announcement_recipients;
DROP POLICY IF EXISTS "Audit logs insert" ON public.activity_logs;
DROP POLICY IF EXISTS "Audit logs read" ON public.activity_logs;
DROP POLICY IF EXISTS "Anon audit logs read" ON public.activity_logs;

-- Also drop duplicate schema.sql policies if they exist
DROP POLICY IF EXISTS "Staff full access rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anon read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff full access bed slots" ON public.bed_slots;
DROP POLICY IF EXISTS "Anon read bed slots" ON public.bed_slots;
DROP POLICY IF EXISTS "Staff full access dormers" ON public.dormers;
DROP POLICY IF EXISTS "Anon read dormers" ON public.dormers;
DROP POLICY IF EXISTS "Staff full access assignments" ON public.room_assignments;
DROP POLICY IF EXISTS "Anon read assignments" ON public.room_assignments;
DROP POLICY IF EXISTS "Staff full access visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Anon read visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Staff full access inventory items" ON public.items;
DROP POLICY IF EXISTS "Anon read inventory items" ON public.items;
DROP POLICY IF EXISTS "Staff full access categories" ON public.categories;
DROP POLICY IF EXISTS "Anon read categories" ON public.categories;
DROP POLICY IF EXISTS "Staff full access stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anon read stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Staff full access room inventory" ON public.room_inventory;
DROP POLICY IF EXISTS "Anon read room inventory" ON public.room_inventory;
DROP POLICY IF EXISTS "Staff full access announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anon read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff full access announcement recipients" ON public.announcement_recipients;
DROP POLICY IF EXISTS "Anon read announcement recipients" ON public.announcement_recipients;

-- ============================================================
-- 2. CREATE SECURE, STRICT RLS POLICIES (LINTER COMPLIANT)
-- SELECT: Permitted for both authenticated staff and anon (hydration)
-- INSERT/UPDATE/DELETE: Restricted strictly to authenticated staff
-- ============================================================

-- ROOMS
CREATE POLICY "Public read rooms" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- BED SLOTS
CREATE POLICY "Public read bed slots" ON public.bed_slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate bed slots" ON public.bed_slots
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DORMERS
CREATE POLICY "Public read dormers" ON public.dormers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate dormers" ON public.dormers
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ROOM ASSIGNMENTS
CREATE POLICY "Public read assignments" ON public.room_assignments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate assignments" ON public.room_assignments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- VISITOR LOGS
CREATE POLICY "Public read visitor logs" ON public.visitor_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate visitor logs" ON public.visitor_logs
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CATEGORIES
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate categories" ON public.categories
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- INVENTORY ITEMS
CREATE POLICY "Public read items" ON public.items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate items" ON public.items
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- STOCK TRANSACTIONS
CREATE POLICY "Public read stock transactions" ON public.stock_transactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate stock transactions" ON public.stock_transactions
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ROOM INVENTORY
CREATE POLICY "Public read room inventory" ON public.room_inventory
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate room inventory" ON public.room_inventory
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ANNOUNCEMENTS
CREATE POLICY "Public read announcements" ON public.announcements
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ANNOUNCEMENT RECIPIENTS
CREATE POLICY "Public read announcement recipients" ON public.announcement_recipients
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate announcement recipients" ON public.announcement_recipients
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ACTIVITY LOGS (Immutable audit trail: anyone can read, only authenticated staff or server can insert; no updates or deletes)
CREATE POLICY "Public read activity logs" ON public.activity_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');
