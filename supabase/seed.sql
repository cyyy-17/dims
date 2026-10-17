-- ============================================================
-- DIMS - Initial Seed Data for ASR Campus
-- ============================================================

-- 1. Initial Categories
INSERT INTO public.categories (id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Furniture & Bedding', 'Beds, mattresses, study tables, chairs, wardrobes'),
  ('00000000-0000-0000-0000-000000000002', 'Electronics & Appliances', 'Fans, desk lamps, purifiers, emergency lights'),
  ('00000000-0000-0000-0000-000000000003', 'Safety & Medical', 'Fire extinguishers, first-aid kits, smoke alarms'),
  ('00000000-0000-0000-0000-000000000004', 'Cleaning & Sanitation', 'Waste bins, sanitizing dispensers, mop buckets'),
  ('00000000-0000-0000-0000-000000000005', 'Maintenance & Tools', 'Toolkits, spare padlocks, plumbing fittings')
ON CONFLICT (name) DO NOTHING;

-- 2. Initial Rooms
INSERT INTO public.rooms (id, room_number, type, capacity, status, monthly_rate, notes)
VALUES
  ('10000000-0000-0000-0000-000000000101', '101', 'double', 2, 'full', 3500.00, 'Well-ventilated corner room with garden view. Includes built-in study nook.'),
  ('10000000-0000-0000-0000-000000000102', '102', 'double', 2, 'partial', 3500.00, 'Standard double room near the main emergency exit.'),
  ('10000000-0000-0000-0000-000000000103', '103', 'single', 1, 'full', 5000.00, 'Single occupancy room assigned to visiting faculty / senior employee.'),
  ('10000000-0000-0000-0000-000000000104', '104', 'quad', 4, 'partial', 2800.00, 'Spacious quad room with 2 double-deck bunk beds and 4 study desks.'),
  ('10000000-0000-0000-0000-000000000105', '105', 'double', 2, 'available', 3500.00, 'Newly repainted, ready for occupancy.'),
  ('20000000-0000-0000-0000-000000000201', '201', 'double', 2, 'partial', 3800.00, 'Balcony access overlooking the central courtyard.'),
  ('20000000-0000-0000-0000-000000000202', '202', 'suite', 2, 'full', 7000.00, 'Executive suite with private en-suite bathroom, dedicated for official guests & visitors.'),
  ('20000000-0000-0000-0000-000000000203', '203', 'single', 1, 'maintenance', 5500.00, 'Undergoing bathroom plumbing repairs. Reopening next week.'),
  ('20000000-0000-0000-0000-000000000204', '204', 'quad', 4, 'available', 3000.00, 'Quad room reserved for upcoming student athletes delegation.'),
  ('20000000-0000-0000-0000-000000000205', '205', 'double', 2, 'available', 3800.00, 'Corner unit with ample natural lighting.')
ON CONFLICT (room_number) DO NOTHING;

-- 3. Initial Bed Slots
INSERT INTO public.bed_slots (room_id, slot_label, is_occupied)
SELECT r.id, s.slot_label, false
FROM public.rooms r
CROSS JOIN (VALUES ('Bed A'), ('Bed B')) AS s(slot_label)
WHERE r.capacity = 2
ON CONFLICT DO NOTHING;

INSERT INTO public.bed_slots (room_id, slot_label, is_occupied)
SELECT r.id, s.slot_label, false
FROM public.rooms r
CROSS JOIN (VALUES ('Single Bed')) AS s(slot_label)
WHERE r.capacity = 1
ON CONFLICT DO NOTHING;

INSERT INTO public.bed_slots (room_id, slot_label, is_occupied)
SELECT r.id, s.slot_label, false
FROM public.rooms r
CROSS JOIN (VALUES ('Lower Bunk 1'), ('Upper Bunk 1'), ('Lower Bunk 2'), ('Upper Bunk 2')) AS s(slot_label)
WHERE r.capacity = 4
ON CONFLICT DO NOTHING;

-- 4. Initial Inventory Catalog
INSERT INTO public.items (category_id, item_code, name, description, unit, min_stock, current_stock, location, qr_code_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ASR-FURN-001', 'Single Orthopedic Foam Mattress (36x75)', 'High-density foam with water-resistant antimicrobial cover', 'pcs', 5, 18, 'Central Storage Room 100', 'ASR-FURN-001'),
  ('00000000-0000-0000-0000-000000000001', 'ASR-FURN-002', 'Ergonomic Wooden Study Desk Chair', 'Solid mahogany finish with lumbar back support', 'pcs', 4, 12, 'Central Storage Room 100', 'ASR-FURN-002'),
  ('00000000-0000-0000-0000-000000000001', 'ASR-FURN-003', 'Steel 2-Door Lockable Wardrobe Locker', 'Heavy-gauge steel with dual padlock hasps', 'units', 2, 8, 'Main Storage Bay', 'ASR-FURN-003'),
  ('00000000-0000-0000-0000-000000000002', 'ASR-ELEC-001', '16-inch Oscillating Wall Fan', '3-speed rotary wall-mount fan with safety grill', 'units', 4, 3, 'Electrical Supply Depot', 'ASR-ELEC-001'),
  ('00000000-0000-0000-0000-000000000002', 'ASR-ELEC-002', 'Emergency Rechargeable LED Lantern', 'Dual-tube 24-hour backup emergency light', 'units', 5, 14, 'Safety Storage Locker', 'ASR-ELEC-002'),
  ('00000000-0000-0000-0000-000000000003', 'ASR-SAFE-001', '10 lbs ABC Dry Chemical Fire Extinguisher', 'Bureau of Fire Protection certified multipurpose extinguisher', 'units', 3, 7, 'Safety Alcove', 'ASR-SAFE-001')
ON CONFLICT (item_code) DO NOTHING;
