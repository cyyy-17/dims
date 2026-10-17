-- ============================================================
-- DIMS (Dormitory & Inventory Management System)
-- Supabase PostgreSQL Schema & Security Policies (RLS)
-- Optimized for ASR Staff Representative Use
-- ============================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER PROFILES (Synced with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'dorm_manager', 'inventory_officer', 'viewer')),
  designation TEXT DEFAULT 'ASR Representative',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DORMITORY ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'Standard',
  capacity INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'partial', 'full', 'maintenance')),
  monthly_rate NUMERIC(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BED SLOTS IN ROOMS
CREATE TABLE IF NOT EXISTS public.bed_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  slot_label TEXT NOT NULL, -- e.g. "Bed A", "Bed B"
  is_occupied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DORMERS (Unified: Students, Employees, Visitors)
CREATE TABLE IF NOT EXISTS public.dormers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('student', 'employee', 'visitor')),
  
  -- Common Details
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  emergency_name TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  emergency_relationship TEXT,
  photo_url TEXT,

  -- Student-specific fields
  student_id_no TEXT,
  year_level TEXT,
  section TEXT,
  course TEXT,

  -- Employee-specific fields
  employee_id_no TEXT,
  department TEXT,
  position TEXT,

  -- Visitor-specific fields
  external_id TEXT,
  organization TEXT,
  purpose_of_stay TEXT,
  expected_departure DATE,

  -- Status & Soft Delete
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'on_leave', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. ROOM ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dormer_id UUID NOT NULL REFERENCES public.dormers(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_slot_id UUID REFERENCES public.bed_slots(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VISITOR LOGS
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  contact TEXT,
  purpose TEXT NOT NULL,
  dormer_visited_id UUID REFERENCES public.dormers(id) ON DELETE SET NULL,
  time_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out TIMESTAMPTZ,
  notes TEXT,
  logged_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVENTORY CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  item_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  min_stock INT NOT NULL DEFAULT 5,
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  location TEXT DEFAULT 'Central Storage',
  photo_url TEXT,
  qr_code_data TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'return')),
  quantity INT NOT NULL CHECK (quantity > 0),
  reference_no TEXT,
  supplier TEXT,
  purpose TEXT,
  issued_to TEXT,
  dormer_id UUID REFERENCES public.dormers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  condition TEXT CHECK (condition IN ('new', 'good', 'fair', 'for_repair', 'condemned')),
  notes TEXT,
  performed_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROOM ASSETS / INVENTORY
CREATE TABLE IF NOT EXISTS public.room_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'for_repair', 'condemned')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.user_profiles(id),
  returned_at TIMESTAMPTZ
);

-- 11. ANNOUNCEMENTS & BREVO EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'students', 'employees', 'visitors', 'room'
  target_filter JSONB DEFAULT '{}'::jsonb,
  sent_to_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  brevo_message_id TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dormer_id UUID REFERENCES public.dormers(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. IMMUTABLE ACTIVITY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g. 'CREATE_DORMER', 'CHECK_IN', 'STOCK_IN', 'SEND_ANNOUNCEMENT'
  module TEXT NOT NULL, -- 'dormitory', 'inventory', 'announcements', 'system'
  target_id TEXT,
  detail TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_dormers_type_status ON public.dormers(type, status);
CREATE INDEX IF NOT EXISTS idx_dormers_email ON public.dormers(email);
CREATE INDEX IF NOT EXISTS idx_room_assignments_dormer ON public.room_assignments(dormer_id, is_current);
CREATE INDEX IF NOT EXISTS idx_room_assignments_room ON public.room_assignments(room_id, is_current);
CREATE INDEX IF NOT EXISTS idx_stock_trans_item ON public.stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Staff Representative Policies: Authenticated staff has full read/write; Anon has read-only access for offline cache hydration
-- Staff Representative Policies: Authenticated staff has full access; Anon is blocked from resident PII
CREATE POLICY "Staff read user profiles"
  ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff update own user profiles"
  ON public.user_profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Public read rooms" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read bed slots" ON public.bed_slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate bed slots" ON public.bed_slots
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SENSITIVE: Dormers PII restricted to authenticated staff
CREATE POLICY "Authenticated staff read dormers" ON public.dormers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate dormers" ON public.dormers
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SENSITIVE: Room assignments restricted to authenticated staff
CREATE POLICY "Authenticated staff read assignments" ON public.room_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate assignments" ON public.room_assignments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SENSITIVE: Visitor logs restricted to authenticated staff
CREATE POLICY "Authenticated staff read visitor logs" ON public.visitor_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate visitor logs" ON public.visitor_logs
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read items" ON public.items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate items" ON public.items
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate categories" ON public.categories
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated staff read stock transactions" ON public.stock_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate stock transactions" ON public.stock_transactions
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read room inventory" ON public.room_inventory
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate room inventory" ON public.room_inventory
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read announcements" ON public.announcements
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated staff mutate announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SENSITIVE: Announcement recipient emails restricted to authenticated staff
CREATE POLICY "Authenticated staff read announcement recipients" ON public.announcement_recipients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff mutate announcement recipients" ON public.announcement_recipients
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SENSITIVE: Activity audit logs restricted to authenticated staff
CREATE POLICY "Authenticated staff read activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated staff insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- ATOMIC STORED PROCEDURES (TRANSACTIONAL SAFETY)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_in_dormer(
  p_dormer_id UUID,
  p_room_id UUID,
  p_bed_slot_id UUID,
  p_check_in_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  v_prior RECORD;
BEGIN
  -- 1. Free any prior active bed slot held by this dormer
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

  -- 2. Insert new assignment
  INSERT INTO public.room_assignments (dormer_id, room_id, bed_slot_id, check_in_date, is_current)
  VALUES (p_dormer_id, p_room_id, p_bed_slot_id, p_check_in_date, TRUE);

  -- 3. Mark bed slot occupied
  UPDATE public.bed_slots SET is_occupied = TRUE WHERE id = p_bed_slot_id;

  -- 4. Mark dormer active
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
  -- 1. Deactivate assignment
  UPDATE public.room_assignments 
  SET is_current = FALSE, check_out_date = p_check_out_date 
  WHERE dormer_id = p_dormer_id AND is_current = TRUE;

  -- 2. Free bed slot
  IF p_bed_slot_id IS NOT NULL THEN
    UPDATE public.bed_slots SET is_occupied = FALSE WHERE id = p_bed_slot_id;
  END IF;

  -- 3. Update dormer status
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
  -- 1. Free old bed
  IF p_old_bed_slot_id IS NOT NULL THEN
    UPDATE public.bed_slots SET is_occupied = FALSE WHERE id = p_old_bed_slot_id;
  END IF;

  -- 2. Close prior assignment
  UPDATE public.room_assignments 
  SET is_current = FALSE, check_out_date = p_transfer_date 
  WHERE dormer_id = p_dormer_id AND is_current = TRUE;

  -- 3. Create new assignment
  INSERT INTO public.room_assignments (dormer_id, room_id, bed_slot_id, check_in_date, is_current)
  VALUES (p_dormer_id, p_new_room_id, p_new_bed_slot_id, p_transfer_date, TRUE);

  -- 4. Mark new bed occupied
  UPDATE public.bed_slots SET is_occupied = TRUE WHERE id = p_new_bed_slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

