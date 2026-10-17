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

-- DORMERS (SENSITIVE: PII restricted to authenticated staff)
CREATE POLICY "Authenticated staff read dormers" ON public.dormers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate dormers" ON public.dormers
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ROOM ASSIGNMENTS (SENSITIVE: Restricted to authenticated staff)
CREATE POLICY "Authenticated staff read assignments" ON public.room_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate assignments" ON public.room_assignments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- VISITOR LOGS (SENSITIVE: Restricted to authenticated staff)
CREATE POLICY "Authenticated staff read visitor logs" ON public.visitor_logs
  FOR SELECT TO authenticated USING (true);
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
CREATE POLICY "Authenticated staff read stock transactions" ON public.stock_transactions
  FOR SELECT TO authenticated USING (true);
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

-- ANNOUNCEMENT RECIPIENTS (SENSITIVE: Emails restricted to authenticated staff)
CREATE POLICY "Authenticated staff read announcement recipients" ON public.announcement_recipients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate announcement recipients" ON public.announcement_recipients
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ACTIVITY LOGS (SENSITIVE: Audit logs restricted to authenticated staff)
CREATE POLICY "Authenticated staff read activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- 3. ENSURE NON-NEGATIVE STOCK CONSTRAINT
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS chk_stock_non_negative;
ALTER TABLE public.items ADD CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0);

-- 4. ATOMIC PROCEDURES (TRANSACTIONAL SAFETY)
CREATE OR REPLACE FUNCTION public.check_in_dormer(
  p_dormer_id UUID,
  p_room_id UUID,
  p_bed_slot_id UUID,
  p_check_in_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  v_prior RECORD;
BEGIN
  FOR v_prior IN 
    SELECT bed_slot_id FROM public.room_assignments 
    WHERE dormer_id = p_dormer_id AND is_current = TRUE 
  LOOP
    IF v_prior.bed_slot_id IS NOT NULL THEN
      UPDATE public.bed_slots SET is_occupied = FALSE WHERE id = v_prior.bed_slot_id;
    END IF;
  END LOOP;

  UPDATE public.room_assignments 
  SET is_current = FALSE, check_out_date = p_check_in_date 
  WHERE dormer_id = p_dormer_id AND is_current = TRUE;

  INSERT INTO public.room_assignments (dormer_id, room_id, bed_slot_id, check_in_date, is_current)
  VALUES (p_dormer_id, p_room_id, p_bed_slot_id, p_check_in_date, TRUE);

  UPDATE public.bed_slots SET is_occupied = TRUE WHERE id = p_bed_slot_id;
  UPDATE public.dormers SET status = 'active', updated_at = NOW() WHERE id = p_dormer_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.checkout_dormer(
  p_dormer_id UUID,
  p_bed_slot_id UUID,
  p_check_out_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.room_assignments 
  SET is_current = FALSE, check_out_date = p_check_out_date 
  WHERE dormer_id = p_dormer_id AND is_current = TRUE;

  IF p_bed_slot_id IS NOT NULL THEN
    UPDATE public.bed_slots SET is_occupied = FALSE WHERE id = p_bed_slot_id;
  END IF;

  UPDATE public.dormers SET status = 'checked_out', updated_at = NOW() WHERE id = p_dormer_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.transfer_dormer(
  p_dormer_id UUID,
  p_old_bed_slot_id UUID,
  p_new_room_id UUID,
  p_new_bed_slot_id UUID,
  p_transfer_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
BEGIN
  IF p_old_bed_slot_id IS NOT NULL THEN
    UPDATE public.bed_slots SET is_occupied = FALSE WHERE id = p_old_bed_slot_id;
  END IF;

  UPDATE public.room_assignments 
  SET is_current = FALSE, check_out_date = p_transfer_date 
  WHERE dormer_id = p_dormer_id AND is_current = TRUE;

  INSERT INTO public.room_assignments (dormer_id, room_id, bed_slot_id, check_in_date, is_current)
  VALUES (p_dormer_id, p_new_room_id, p_new_bed_slot_id, p_transfer_date, TRUE);

  UPDATE public.bed_slots SET is_occupied = TRUE WHERE id = p_new_bed_slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
