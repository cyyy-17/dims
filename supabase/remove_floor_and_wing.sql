-- ============================================================
-- DIMS Migration: Remove Floor and Wing/Corridor Columns
-- ============================================================

-- Safely drop floor and wing columns from rooms table if they exist
ALTER TABLE public.rooms DROP COLUMN IF EXISTS floor;
ALTER TABLE public.rooms DROP COLUMN IF EXISTS wing;
