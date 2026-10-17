import {
  Dormer,
  Room,
  BedSlot,
  VisitorLog,
  InventoryCategory,
  InventoryItem,
  StockTransaction,
  RoomInventoryItem,
  Announcement,
  ActivityLog,
  StaffUser,
  AppSettings,
  ItemCondition,
  StockTransactionType,
  DormerType,
} from './types';
import { sendBrevoAnnouncement } from './brevo';
import { getSupabaseClient } from './supabase';
import { toast } from '@/components/ui/Toast';
import { generateUUID, isUUID } from './utils';

const STORAGE_KEY_PREFIX = 'dims_asr_v2_';

// Initial Seeds
const INITIAL_STAFF: StaffUser = {
  id: 'usr-asr-lead',
  fullName: 'Mary Joy Clemente',
  email: 'aseanresidences@firstasia.edu.ph',
  role: 'super_admin',
  designation: 'ASR Head Representative & Dorm Custodian',
  contactNo: '+63 917 555 0192',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_STAFF_USERS: StaffUser[] = [
  INITIAL_STAFF,
  {
    id: 'usr-dorm-mgr',
    fullName: 'Carlos Mendoza',
    email: 'cmendoza@firstasia.edu.ph',
    role: 'dorm_manager',
    designation: 'Assistant Dormitory Manager',
    contactNo: '+63 918 234 5678',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-inv-officer',
    fullName: 'Elena Santos',
    email: 'esantos@firstasia.edu.ph',
    role: 'inventory_officer',
    designation: 'Property & Inventory Custodian',
    contactNo: '+63 920 345 6789',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_SETTINGS: AppSettings = {
  schoolName: 'First Asia Institute of Technology and Humanities',
  campusName: 'ASEAN Student Residences (ASR)',
  academicYear: 'A.Y. 2026 - 2027',
  systemName: 'DIMS',
  dormitoryLeadName: 'Mary Joy Clemente',
  dormitoryLeadContact: '+63 917 555 0192',
  brevoSenderEmail:
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || 'aseanresidences@firstasia.edu.ph',
  brevoSenderName:
    process.env.NEXT_PUBLIC_BREVO_SENDER_NAME || 'ASEAN Student Residences',
  brevoApiKey: '', // Key is server-only; managed via BREVO_API_KEY env var on the server
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseConnected: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
};

const INITIAL_CATEGORIES: InventoryCategory[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Furniture & Bedding', description: 'Beds, mattresses, study tables, chairs, wardrobes' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Electronics & Appliances', description: 'Fans, desk lamps, purifiers, emergency lights' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Safety & Medical', description: 'Fire extinguishers, first-aid kits, smoke alarms' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Cleaning & Sanitation', description: 'Waste bins, sanitizing dispensers, mop buckets' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Maintenance & Tools', description: 'Toolkits, spare padlocks, plumbing fittings' },
];

const INITIAL_ROOMS: Room[] = [
  {
    id: '10000000-0000-0000-0000-000000000101',
    roomNumber: '101',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3500,
    notes: 'Well-ventilated corner room with garden view. Includes built-in study nook.',
    bedSlots: [
      { id: '10000000-0000-0000-0001-000000000101', roomId: '10000000-0000-0000-0000-000000000101', slotLabel: 'Bed A', isOccupied: false },
      { id: '10000000-0000-0000-0002-000000000101', roomId: '10000000-0000-0000-0000-000000000101', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000102',
    roomNumber: '102',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3500,
    notes: 'Near study lounge and emergency exit.',
    bedSlots: [
      { id: '10000000-0000-0000-0001-000000000102', roomId: '10000000-0000-0000-0000-000000000102', slotLabel: 'Bed A', isOccupied: false },
      { id: '10000000-0000-0000-0002-000000000102', roomId: '10000000-0000-0000-0000-000000000102', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000103',
    roomNumber: '103',
    type: 'single',
    capacity: 1,
    status: 'available',
    monthlyRate: 5500,
    notes: 'Dedicated single room for senior staff or faculty.',
    bedSlots: [
      { id: '10000000-0000-0000-0001-000000000103', roomId: '10000000-0000-0000-0000-000000000103', slotLabel: 'Single Bed 1', isOccupied: false },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000104',
    roomNumber: '104',
    type: 'quad',
    capacity: 4,
    status: 'available',
    monthlyRate: 2800,
    notes: 'Spacious quad room with 2 double bunks.',
    bedSlots: [
      { id: '10000000-0000-0000-0001-000000000104', roomId: '10000000-0000-0000-0000-000000000104', slotLabel: 'Lower Bunk 1', isOccupied: false },
      { id: '10000000-0000-0000-0002-000000000104', roomId: '10000000-0000-0000-0000-000000000104', slotLabel: 'Upper Bunk 1', isOccupied: false },
      { id: '10000000-0000-0000-0003-000000000104', roomId: '10000000-0000-0000-0000-000000000104', slotLabel: 'Lower Bunk 2', isOccupied: false },
      { id: '10000000-0000-0000-0004-000000000104', roomId: '10000000-0000-0000-0000-000000000104', slotLabel: 'Upper Bunk 2', isOccupied: false },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000105',
    roomNumber: '105',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3500,
    notes: 'Newly repainted, ready for occupancy.',
    bedSlots: [
      { id: '10000000-0000-0000-0001-000000000105', roomId: '10000000-0000-0000-0000-000000000105', slotLabel: 'Bed A', isOccupied: false },
      { id: '10000000-0000-0000-0002-000000000105', roomId: '10000000-0000-0000-0000-000000000105', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000201',
    roomNumber: '201',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3800,
    notes: 'Balcony access overlooking the central courtyard.',
    bedSlots: [
      { id: '20000000-0000-0000-0001-000000000201', roomId: '20000000-0000-0000-0000-000000000201', slotLabel: 'Bed A', isOccupied: false },
      { id: '20000000-0000-0000-0002-000000000201', roomId: '20000000-0000-0000-0000-000000000201', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000202',
    roomNumber: '202',
    type: 'suite',
    capacity: 2,
    status: 'available',
    monthlyRate: 7000,
    notes: 'Executive suite with private en-suite bathroom, dedicated for official guests & visitors.',
    bedSlots: [
      { id: '20000000-0000-0000-0001-000000000202', roomId: '20000000-0000-0000-0000-000000000202', slotLabel: 'Suite Bed 1', isOccupied: false },
      { id: '20000000-0000-0000-0002-000000000202', roomId: '20000000-0000-0000-0000-000000000202', slotLabel: 'Suite Bed 2', isOccupied: false },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000203',
    roomNumber: '203',
    type: 'single',
    capacity: 1,
    status: 'available',
    monthlyRate: 5500,
    notes: 'Standard single room.',
    bedSlots: [
      { id: '20000000-0000-0000-0001-000000000203', roomId: '20000000-0000-0000-0000-000000000203', slotLabel: 'Single Bed', isOccupied: false },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000204',
    roomNumber: '204',
    type: 'quad',
    capacity: 4,
    status: 'available',
    monthlyRate: 3000,
    notes: 'Quad room with air conditioning unit.',
    bedSlots: [
      { id: '20000000-0000-0000-0001-000000000204', roomId: '20000000-0000-0000-0000-000000000204', slotLabel: 'Lower Bed A', isOccupied: false },
      { id: '20000000-0000-0000-0002-000000000204', roomId: '20000000-0000-0000-0000-000000000204', slotLabel: 'Upper Bed A', isOccupied: false },
      { id: '20000000-0000-0000-0003-000000000204', roomId: '20000000-0000-0000-0000-000000000204', slotLabel: 'Lower Bed B', isOccupied: false },
      { id: '20000000-0000-0000-0004-000000000204', roomId: '20000000-0000-0000-0000-000000000204', slotLabel: 'Upper Bed B', isOccupied: false },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000205',
    roomNumber: '205',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3800,
    notes: 'Fully furnished, pristine condition.',
    bedSlots: [
      { id: '20000000-0000-0000-0001-000000000205', roomId: '20000000-0000-0000-0000-000000000205', slotLabel: 'Bed A', isOccupied: false },
      { id: '20000000-0000-0000-0002-000000000205', roomId: '20000000-0000-0000-0000-000000000205', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
];

const INITIAL_DORMERS: Dormer[] = [];
const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    categoryId: '00000000-0000-0000-0000-000000000001',
    categoryName: 'Furniture & Bedding',
    itemCode: 'ASR-FURN-001',
    name: 'Single Orthopedic Foam Mattress (36x75)',
    description: 'High-density foam with water-resistant antimicrobial cover',
    unit: 'pcs',
    minStock: 5,
    currentStock: 18,
    location: 'Central Storage Room 100',
    qrCodeData: 'DIMS:ITEM:ASR-FURN-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    categoryId: '00000000-0000-0000-0000-000000000001',
    categoryName: 'Furniture & Bedding',
    itemCode: 'ASR-FURN-002',
    name: 'Ergonomic Wooden Study Desk Chair',
    description: 'Solid mahogany finish with lumbar back support',
    unit: 'pcs',
    minStock: 4,
    currentStock: 12,
    location: 'Central Storage Room 100',
    qrCodeData: 'DIMS:ITEM:ASR-FURN-002',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    categoryId: '00000000-0000-0000-0000-000000000001',
    categoryName: 'Furniture & Bedding',
    itemCode: 'ASR-FURN-003',
    name: 'Steel 2-Door Lockable Wardrobe Locker',
    description: 'Heavy-gauge steel with dual padlock hasps',
    unit: 'units',
    minStock: 2,
    currentStock: 8,
    location: 'Main Storage Bay',
    qrCodeData: 'DIMS:ITEM:ASR-FURN-003',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    categoryId: '00000000-0000-0000-0000-000000000002',
    categoryName: 'Electronics & Appliances',
    itemCode: 'ASR-ELEC-001',
    name: '16-inch Oscillating Wall Fan',
    description: '3-speed rotary wall-mount fan with safety grill',
    unit: 'units',
    minStock: 4,
    currentStock: 3,
    location: 'Electrical Supply Depot',
    qrCodeData: 'DIMS:ITEM:ASR-ELEC-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    categoryId: '00000000-0000-0000-0000-000000000002',
    categoryName: 'Electronics & Appliances',
    itemCode: 'ASR-ELEC-002',
    name: 'Emergency Rechargeable LED Lantern',
    description: 'Dual-tube 24-hour backup emergency light',
    unit: 'units',
    minStock: 5,
    currentStock: 14,
    location: 'Safety Storage Locker',
    qrCodeData: 'DIMS:ITEM:ASR-ELEC-002',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    categoryId: '00000000-0000-0000-0000-000000000003',
    categoryName: 'Safety & Medical',
    itemCode: 'ASR-SAFE-001',
    name: '10 lbs ABC Dry Chemical Fire Extinguisher',
    description: 'Bureau of Fire Protection certified multipurpose extinguisher',
    unit: 'units',
    minStock: 3,
    currentStock: 7,
    location: 'Safety Alcove',
    qrCodeData: 'DIMS:ITEM:ASR-SAFE-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
const INITIAL_ROOM_INVENTORY: RoomInventoryItem[] = [];
const INITIAL_TRANSACTIONS: StockTransaction[] = [];
const INITIAL_VISITOR_LOGS: VisitorLog[] = [];
const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
const INITIAL_LOGS: ActivityLog[] = [];

// ─────────────────────────────────────────────────────────────
// 1. STORAGE HELPERS & LOCAL PERSISTENCE
// ─────────────────────────────────────────────────────────────
class DataStore {
  private listeners: Set<() => void> = new Set();

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      let parsed = JSON.parse(stored);
      // Migrate legacy non-UUID rooms or categories if present
      if (key === 'rooms' && Array.isArray(parsed) && parsed.some((r: any) => !isUUID(r.id))) {
        parsed = defaultValue;
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue));
      } else if (key === 'categories' && Array.isArray(parsed) && parsed.some((c: any) => !isUUID(c.id))) {
        parsed = defaultValue;
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue));
      }
      return parsed;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Storage quota exceeded or error:', e);
    }
  }

  public clearAllLocalData(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('dims_asr_') || k.startsWith('dims_pending_sync_queue'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      this.notify();
    } catch (e) {
      console.error('Failed to clear local data:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SUPABASE CLOUD DATA LAYER & OFFLINE QUEUE
  // ─────────────────────────────────────────────────────────────
  private isSyncing = false;
  private syncStatus: 'synced' | 'syncing' | 'pending' | 'offline' = 'synced';

  public getSyncStatus(): 'synced' | 'syncing' | 'pending' | 'offline' {
    if (typeof window !== 'undefined' && !navigator.onLine) return 'offline';
    if (this.isSyncing) return 'syncing';
    if (this.getSyncQueue().length > 0) return 'pending';
    return this.syncStatus;
  }

  public setSyncStatus(status: 'synced' | 'syncing' | 'pending' | 'offline'): void {
    this.syncStatus = status;
    this.notify();
  }

  public getPendingQueueCount(): number {
    return this.getSyncQueue().length;
  }

  private getSyncQueue(): Array<{ id: string; table: string; action: string; payload: any }> {
    if (typeof window === 'undefined') return [];
    try {
      const q = localStorage.getItem('dims_pending_sync_queue');
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }

  private saveSyncQueue(queue: Array<{ id: string; table: string; action: string; payload: any }>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('dims_pending_sync_queue', JSON.stringify(queue));
      this.notify();
    } catch (e) {
      console.error('Failed to save sync queue:', e);
    }
  }

  public enqueueMutation(action: string, table: string, payload: any): void {
    const queue = this.getSyncQueue();
    queue.push({
      id: generateUUID(),
      action,
      table,
      payload,
    });
    this.saveSyncQueue(queue);
    this.setSyncStatus('pending');
  }

  public async dispatchMutation(action: string, table: string, payload: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Offline -> directly queue
    if (!navigator.onLine) {
      this.enqueueMutation(action, table, payload);
      return true;
    }

    try {
      this.setSyncStatus('syncing');
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table, payload }),
        signal: controller.signal,
      });
      clearTimeout(tId);

      if (!res.ok) {
        this.enqueueMutation(action, table, payload);
        return false;
      }

      const data = await res.json();
      if (!data.success) {
        this.enqueueMutation(action, table, payload);
        return false;
      }

      this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
      return true;
    } catch {
      this.enqueueMutation(action, table, payload);
      return false;
    } finally {
      if (this.syncStatus === 'syncing') {
        this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
      }
    }
  }

  public async processPendingSyncQueue(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations: queue }),
        signal: controller.signal,
      });
      clearTimeout(tId);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.results)) {
            const failedQueue: typeof queue = [];
            data.results.forEach((r: any, idx: number) => {
              if (!r.success && queue[idx]) {
                console.warn(
                  `Sync mutation failed for ${queue[idx].table}.${queue[idx].action}:`,
                  r.error
                );
                failedQueue.push(queue[idx]);
              }
            });
            this.saveSyncQueue(failedQueue);
            this.setSyncStatus(failedQueue.length > 0 ? 'pending' : 'synced');
            return;
          }
          this.saveSyncQueue([]);
          this.setSyncStatus('synced');
          return;
        }
      }
    } catch {
      // Keep queue for next attempt
    }

    // Direct Supabase client fallback if client credentials exist
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const remainingQueue = [];
    for (const item of queue) {
      try {
        let resErr: any = null;
        if (item.action === 'INSERT') {
          const r = await supabase.from(item.table).insert(item.payload);
          resErr = r.error;
        } else if (item.action === 'UPSERT') {
          const r = await supabase.from(item.table).upsert(item.payload);
          resErr = r.error;
        } else if (item.action === 'UPDATE') {
          const r = await supabase.from(item.table).update(item.payload.data).eq('id', item.payload.id);
          resErr = r.error;
        } else if (item.action === 'DELETE') {
          const r = await supabase.from(item.table).delete().eq('id', item.payload.id);
          resErr = r.error;
        }
        if (resErr) {
          remainingQueue.push(item);
        }
      } catch {
        remainingQueue.push(item);
      }
    }
    this.saveSyncQueue(remainingQueue);
    this.setSyncStatus(remainingQueue.length > 0 ? 'pending' : 'synced');
  }

  private applySyncData(data: {
    rooms?: any[];
    bedSlots?: any[];
    dormers?: any[];
    assignments?: any[];
    categories?: any[];
    items?: any[];
    stockTransactions?: any[];
    roomInventory?: any[];
    visitorLogs?: any[];
    announcements?: any[];
    activityLogs?: any[];
  }): void {
    if (data.rooms && data.rooms.length > 0) {
      const mappedRooms: Room[] = data.rooms.map((r: any) => ({
        id: r.id,
        roomNumber: r.room_number,
        type: r.type,
        capacity: r.capacity,
        status: r.status,
        monthlyRate: Number(r.monthly_rate) || 0,
        notes: r.notes || '',
        bedSlots: (data.bedSlots || [])
          .filter((s: any) => s.room_id === r.id)
          .map((s: any) => ({
            id: s.id,
            roomId: s.room_id,
            slotLabel: s.slot_label,
            isOccupied: s.is_occupied || false,
          })),
      }));
      this.setItem('rooms', mappedRooms);
    }

    if (data.dormers && data.dormers.length > 0) {
      const roomsCache = this.getItem<Room[]>('rooms', INITIAL_ROOMS);
      const mappedDormers: Dormer[] = data.dormers.map((d: any) => {
        const asg: any = (data.assignments || []).find((a: any) => a.dormer_id === d.id);
        const room = asg ? roomsCache.find((r) => r.id === asg.room_id) : undefined;
        const slot = room ? room.bedSlots?.find((s) => s.id === asg.bed_slot_id) : undefined;

        return {
          id: d.id,
          type: d.type,
          firstName: d.first_name,
          lastName: d.last_name,
          email: d.email,
          contactNo: d.contact_no,
          gender: d.gender,
          emergencyName: d.emergency_name,
          emergencyContact: d.emergency_contact,
          emergencyRelationship: d.emergency_relationship,
          photoUrl: d.photo_url,
          studentIdNo: d.student_id_no,
          yearLevel: d.year_level,
          section: d.section,
          course: d.course,
          employeeIdNo: d.employee_id_no,
          department: d.department,
          position: d.position,
          externalId: d.external_id,
          organization: d.organization,
          purposeOfStay: d.purpose_of_stay,
          expectedDeparture: d.expected_departure,
          status: d.status,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          currentAssignment: asg
            ? {
                id: asg.id,
                roomId: asg.room_id,
                roomNumber: room?.roomNumber || 'Unknown',
                bedSlotId: asg.bed_slot_id,
                slotLabel: slot?.slotLabel || 'Assigned',
                checkInDate: asg.check_in_date,
                checkOutDate: asg.check_out_date,
              }
            : undefined,
        };
      });
      this.setItem('dormers', mappedDormers);
    }

    if (data.categories && data.categories.length > 0) {
      const mappedCategories: InventoryCategory[] = data.categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
      }));
      this.setItem('categories', mappedCategories);
    }

    if (data.items && data.items.length > 0) {
      const categoriesCache = this.getItem<InventoryCategory[]>('categories', INITIAL_CATEGORIES);
      const mappedItems: InventoryItem[] = data.items.map((i: any) => {
        const cat = categoriesCache.find((c) => c.id === i.category_id);
        return {
          id: i.id,
          categoryId: i.category_id || '',
          categoryName: cat?.name || 'Uncategorized',
          itemCode: i.item_code,
          name: i.name,
          description: i.description || '',
          unit: i.unit || 'pcs',
          minStock: i.min_stock || 0,
          currentStock: i.current_stock || 0,
          location: i.location || 'Central Storage',
          photoUrl: i.photo_url,
          qrCodeData: i.qr_code_data || `DIMS:ITEM:${i.item_code}`,
          isActive: i.is_active ?? true,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
        };
      });
      this.setItem('items', mappedItems);
    }

    if (data.visitorLogs && data.visitorLogs.length > 0) {
      const dormersCache = this.getItem<Dormer[]>('dormers', INITIAL_DORMERS);
      const mappedVisitors: VisitorLog[] = data.visitorLogs.map((v: any) => {
        const dormer = dormersCache.find((d) => d.id === v.dormer_visited_id);
        return {
          id: v.id,
          visitorName: v.visitor_name,
          contact: v.contact || '',
          purpose: v.purpose,
          dormerVisitedId: v.dormer_visited_id,
          dormerVisitedName: dormer ? `${dormer.firstName} ${dormer.lastName}` : undefined,
          timeIn: v.time_in,
          timeOut: v.time_out,
          notes: v.notes,
          loggedBy: 'Maria Joy Clemente',
          createdAt: v.created_at,
        };
      });
      this.setItem('visitor_logs', mappedVisitors);
    }

    if (data.announcements && data.announcements.length > 0) {
      const mappedAnnouncements: Announcement[] = data.announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        targetAudience: a.target_audience,
        sentToCount: a.sent_to_count || 0,
        failedCount: a.failed_count || 0,
        status: a.status,
        sentAt: a.sent_at,
        brevoMessageId: a.brevo_message_id,
        createdBy: a.created_by || 'Maria Joy Clemente',
        createdAt: a.created_at,
      }));
      this.setItem('announcements', mappedAnnouncements);
    }

    if (data.stockTransactions && data.stockTransactions.length > 0) {
      const mappedTx: StockTransaction[] = data.stockTransactions.map((tx: any) => ({
        id: tx.id,
        itemId: tx.item_id,
        itemCode: tx.item_code || '',
        itemName: tx.item_name || '',
        type: tx.type,
        quantity: tx.quantity,
        referenceNo: tx.reference_no,
        supplier: tx.supplier,
        purpose: tx.purpose,
        issuedTo: tx.issued_to,
        dormerId: tx.dormer_id,
        roomId: tx.room_id,
        condition: tx.condition || 'good',
        notes: tx.notes,
        performedBy: 'ASR Custodian',
        createdAt: tx.created_at,
      }));
      this.setItem('transactions', mappedTx);
    }

    if (data.roomInventory && data.roomInventory.length > 0) {
      const mappedRi: RoomInventoryItem[] = data.roomInventory.map((ri: any) => ({
        id: ri.id,
        roomId: ri.room_id,
        roomNumber: ri.room_number || '',
        itemId: ri.item_id,
        itemName: ri.item_name || '',
        itemCode: ri.item_code || '',
        quantity: ri.quantity,
        condition: ri.condition || 'good',
        assignedAt: ri.assigned_at,
        assignedBy: 'ASR Custodian',
        returnedAt: ri.returned_at,
      }));
      this.setItem('room_inventory', mappedRi);
    }

    if (data.activityLogs && data.activityLogs.length > 0) {
      const mappedLogs: ActivityLog[] = data.activityLogs.map((l: any) => ({
        id: l.id,
        actorName: l.actor_name,
        action: l.action,
        module: l.module,
        targetId: l.target_id,
        detail: l.detail,
        createdAt: l.created_at,
      }));
      this.setItem('activity_logs', mappedLogs);
    }
  }

  private lastSyncTimestamp = 0;
  private readonly SYNC_COOLDOWN_MS = 20000; // 20s throttle to prevent excessive queries on page navigation

  public async syncFromSupabase(force: boolean = false): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine || this.isSyncing) return;
    const now = Date.now();
    if (!force && now - this.lastSyncTimestamp < this.SYNC_COOLDOWN_MS) {
      return;
    }
    this.isSyncing = true;
    this.setSyncStatus('syncing');

    // Auto-recovery watchdog: ensure syncing state never hangs for more than 8 seconds
    const watchdog = setTimeout(() => {
      if (this.isSyncing) {
        this.isSyncing = false;
        this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
        this.notify();
      }
    }, 8000);

    try {
      // 1. Try server-side authenticated GET /api/sync with 5s timeout
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/sync', { signal: controller.signal });
        clearTimeout(tId);

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            this.lastSyncTimestamp = Date.now();
            this.applySyncData(json.data);
            await this.processPendingSyncQueue();
            return;
          }
        }
      } catch {
        // Fallback to direct client queries below
      }

      // 2. Direct Supabase client fallback
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const fetchPromise = Promise.all([
        supabase.from('rooms').select('*'),
        supabase.from('bed_slots').select('*'),
        supabase.from('dormers').select('*'),
        supabase.from('room_assignments').select('*').eq('is_current', true),
        supabase.from('categories').select('*'),
        supabase.from('items').select('*'),
        supabase.from('stock_transactions').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('room_inventory').select('*'),
        supabase.from('visitor_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase client sync timeout')), 5000)
      );

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
      ] = await Promise.race([fetchPromise, timeoutPromise]);

      this.applySyncData({
        rooms: rooms || undefined,
        bedSlots: bedSlots || undefined,
        dormers: dormers || undefined,
        assignments: assignments || undefined,
        categories: categories || undefined,
        items: items || undefined,
        stockTransactions: stockTransactions || undefined,
        roomInventory: roomInventory || undefined,
        visitorLogs: visitorLogs || undefined,
        announcements: announcements || undefined,
        activityLogs: activityLogs || undefined,
      });

      await this.processPendingSyncQueue();
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    } finally {
      clearTimeout(watchdog);
      this.isSyncing = false;
      this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
      this.notify();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SETTINGS & AUTHENTICATION CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  public getSettings(): AppSettings {
    return this.getItem<AppSettings>('settings', INITIAL_SETTINGS);
  }

  public updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();
    this.setItem('settings', { ...current, ...updates });
    this.logActivity('UPDATE_SETTINGS', 'settings', 'Updated system preferences and campus configurations.');
  }

  public getCurrentUser(): StaffUser {
    return this.getItem<StaffUser>('current_user', INITIAL_STAFF_USERS[0]);
  }

  public updateCurrentUser(updates: Partial<StaffUser>): void {
    const current = this.getCurrentUser();
    const updated: StaffUser = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setItem('current_user', updated);

    // Synchronize within staff_users list
    const staffList = this.getStaffUsers();
    const idx = staffList.findIndex(
      (u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase()
    );
    if (idx !== -1) {
      staffList[idx] = { ...staffList[idx], ...updated };
      this.setItem('staff_users', staffList);
    }

    // Keep dormitory lead in settings aligned if updated user is the lead / super admin
    if (updates.fullName) {
      const settings = this.getSettings();
      if (settings.dormitoryLeadName === current.fullName || current.role === 'super_admin') {
        this.updateSettings({
          dormitoryLeadName: updates.fullName,
          dormitoryLeadContact: updates.contactNo || settings.dormitoryLeadContact,
        });
      }
    }

    if (typeof window !== 'undefined') {
      if (updates.fullName) localStorage.setItem('dims_staff_name', updates.fullName);
      if (updates.email) localStorage.setItem('dims_staff_email', updates.email);
    }

    this.logActivity('UPDATE_PROFILE', 'auth', `Updated personal profile credentials for ${updated.fullName}.`);
    this.notify();
  }

  public getStaffUsers(): StaffUser[] {
    return this.getItem<StaffUser[]>('staff_users', INITIAL_STAFF_USERS);
  }

  public addStaffUser(userData: Omit<StaffUser, 'id' | 'createdAt' | 'updatedAt'>): StaffUser {
    const staffList = this.getStaffUsers();
    const existing = staffList.find(
      (u) => u.email.toLowerCase() === userData.email.trim().toLowerCase()
    );
    if (existing) {
      toast.error('Email Conflict', `A staff member with email ${userData.email} already exists.`);
      return existing;
    }

    const newId = generateUUID();
    const newUser: StaffUser = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    staffList.push(newUser);
    this.setItem('staff_users', staffList);
    this.logActivity('CREATE_STAFF_USER', 'settings', `Provisioned new staff account: ${newUser.fullName} (${newUser.role}).`);
    this.notify();
    return newUser;
  }

  public updateStaffUser(id: string, updates: Partial<StaffUser>): void {
    const staffList = this.getStaffUsers();
    const idx = staffList.findIndex((u) => u.id === id);
    if (idx !== -1) {
      staffList[idx] = {
        ...staffList[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.setItem('staff_users', staffList);

      // If updating current user, sync current_user too
      const current = this.getCurrentUser();
      const isCurrent =
        current.id === id ||
        (staffList[idx].email && current.email.toLowerCase() === staffList[idx].email.toLowerCase());

      if (isCurrent) {
        this.setItem('current_user', staffList[idx]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dims_staff_name', staffList[idx].fullName);
          localStorage.setItem('dims_staff_email', staffList[idx].email);
        }
        if (updates.fullName) {
          const settings = this.getSettings();
          if (settings.dormitoryLeadName === current.fullName || current.role === 'super_admin') {
            this.updateSettings({
              dormitoryLeadName: updates.fullName,
              dormitoryLeadContact: updates.contactNo || settings.dormitoryLeadContact,
            });
          }
        }
      }

      this.logActivity('UPDATE_STAFF_USER', 'settings', `Updated staff account settings for ${staffList[idx].fullName}.`);
      this.notify();
    }
  }

  public deleteStaffUser(id: string): boolean {
    const current = this.getCurrentUser();
    if (current.id === id) {
      toast.error('Operation Prohibited', 'You cannot delete your own active super admin account.');
      return false;
    }

    const staffList = this.getStaffUsers();
    const target = staffList.find((u) => u.id === id);
    if (!target) return false;

    const filtered = staffList.filter((u) => u.id !== id);
    this.setItem('staff_users', filtered);
    this.logActivity('DELETE_STAFF_USER', 'settings', `Removed staff account: ${target.fullName}.`);
    this.notify();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ROOM & BED SLOT MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  public getRooms(): Room[] {
    const rawRooms = this.getItem<any[]>('rooms', INITIAL_ROOMS);
    let hadLegacy = false;
    const cleanRooms: Room[] = rawRooms.map((room) => {
      if (room && ('floor' in room || 'wing' in room)) {
        hadLegacy = true;
        const clean = { ...room };
        delete clean.floor;
        delete clean.wing;
        return clean as Room;
      }
      return room as Room;
    });
    if (hadLegacy) {
      this.setItem('rooms', cleanRooms);
    }

    const rooms = cleanRooms;
    const dormers = this.getDormers();
    const roomInventory = this.getRoomInventory();

    // Dynamically calculate occupants and status
    return rooms.map((room) => {
      const occupants = dormers
        .filter((d) => d.status === 'active' && d.currentAssignment?.roomId === room.id)
        .map((d) => ({
          dormerId: d.id,
          fullName: `${d.firstName} ${d.lastName}`,
          type: d.type,
          email: d.email,
          slotLabel: d.currentAssignment?.slotLabel || 'Assigned',
          checkInDate: d.currentAssignment?.checkInDate || '',
        }));

      const assignedItemsCount = roomInventory.filter((ri) => ri.roomId === room.id).reduce((sum, item) => sum + item.quantity, 0);

      let status = room.status;
      if (status !== 'maintenance') {
        if (occupants.length === 0) status = 'available';
        else if (occupants.length >= room.capacity) status = 'full';
        else status = 'partial';
      }

      return {
        ...room,
        status,
        occupants,
        assignedItemsCount,
      };
    });
  }

  public getRoomById(id: string): Room | undefined {
    return this.getRooms().find((r) => r.id === id);
  }

  public getBedSlots(roomId: string): BedSlot[] {
    const room = this.getRooms().find((r) => r.id === roomId);
    return room?.bedSlots || [];
  }

  public addRoom(roomData: Omit<Room, 'id' | 'bedSlots'>): Room {
    const rooms = this.getRooms();
    const newId = generateUUID();
    const bedSlots: BedSlot[] = [];

    for (let i = 0; i < roomData.capacity; i++) {
      const char = String.fromCharCode(65 + i);
      const slotId = generateUUID();
      bedSlots.push({
        id: slotId,
        roomId: newId,
        slotLabel: `Bed ${char}`,
        isOccupied: false,
      });
    }

    const newRoom: Room = {
      ...roomData,
      id: newId,
      bedSlots,
    };

    rooms.push(newRoom);
    this.setItem('rooms', rooms);
    this.logActivity('CREATE_ROOM', 'dormitory', `Added Room ${newRoom.roomNumber} (${newRoom.type}, capacity: ${newRoom.capacity}).`);

    this.dispatchMutation('INSERT', 'rooms', {
      id: newRoom.id,
      room_number: newRoom.roomNumber,
      type: newRoom.type,
      capacity: newRoom.capacity,
      status: newRoom.status,
      monthly_rate: newRoom.monthlyRate,
      notes: newRoom.notes,
    });

    for (const slot of bedSlots) {
      this.dispatchMutation('INSERT', 'bed_slots', {
        id: slot.id,
        room_id: newRoom.id,
        slot_label: slot.slotLabel,
        is_occupied: false,
      });
    }

    return newRoom;
  }

  public updateRoom(id: string, updates: Partial<Room>): void {
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const currentSlots = rooms[idx].bedSlots ? [...rooms[idx].bedSlots] : [];

      // Reconcile bed slots if capacity changes
      if (updates.capacity !== undefined && updates.capacity !== rooms[idx].capacity) {
        const targetCap = Number(updates.capacity);
        if (targetCap > currentSlots.length) {
          // Generate additional bed slots
          for (let i = currentSlots.length; i < targetCap; i++) {
            const char = String.fromCharCode(65 + i);
            const newSlot: BedSlot = {
              id: generateUUID(),
              roomId: id,
              slotLabel: `Bed ${char}`,
              isOccupied: false,
            };
            currentSlots.push(newSlot);
            this.dispatchMutation('INSERT', 'bed_slots', {
              id: newSlot.id,
              room_id: id,
              slot_label: newSlot.slotLabel,
              is_occupied: false,
            });
          }
          updates.bedSlots = currentSlots;
        } else if (targetCap < currentSlots.length) {
          const occupiedCount = currentSlots.filter((s) => s.isOccupied).length;
          if (occupiedCount > targetCap) {
            toast.warning(
              'Capacity Limit Notice',
              `Cannot reduce capacity below ${occupiedCount} active occupants. Please transfer or check out residents first.`
            );
            updates.capacity = currentSlots.length;
          } else {
            // Safely remove only unoccupied slots from the end
            const slotsToKeep: BedSlot[] = [];
            const slotsToRemove: BedSlot[] = [];
            for (const slot of currentSlots) {
              if (slot.isOccupied || slotsToKeep.length < targetCap) {
                slotsToKeep.push(slot);
              } else {
                slotsToRemove.push(slot);
              }
            }
            updates.bedSlots = slotsToKeep;
            for (const rmSlot of slotsToRemove) {
              this.dispatchMutation('DELETE', 'bed_slots', { id: rmSlot.id });
            }
          }
        }
      }

      rooms[idx] = { ...rooms[idx], ...updates };
      this.setItem('rooms', rooms);
      this.logActivity('UPDATE_ROOM', 'dormitory', `Updated Room ${rooms[idx].roomNumber} parameters.`);

      const dataToUpdate: any = {};
      if (updates.roomNumber !== undefined) dataToUpdate.room_number = updates.roomNumber;
      if (updates.type !== undefined) dataToUpdate.type = updates.type;
      if (updates.capacity !== undefined) dataToUpdate.capacity = updates.capacity;
      if (updates.status !== undefined) dataToUpdate.status = updates.status;
      if (updates.monthlyRate !== undefined) dataToUpdate.monthly_rate = updates.monthlyRate;
      if (updates.notes !== undefined) dataToUpdate.notes = updates.notes;

      this.dispatchMutation('UPDATE', 'rooms', { id, data: dataToUpdate });
    }
  }

  public deleteRoom(id: string): boolean {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === id);
    if (!room) return false;

    // Check if room has active occupants
    const activeOccupants = this.getDormers().filter((d) => d.status === 'active' && d.currentAssignment?.roomId === id);
    if (activeOccupants.length > 0) {
      toast.error('Cannot Delete Room', `Room ${room.roomNumber} currently has ${activeOccupants.length} active occupants.`);
      return false;
    }

    const filtered = rooms.filter((r) => r.id !== id);
    this.setItem('rooms', filtered);
    this.logActivity('DELETE_ROOM', 'dormitory', `Deleted Room ${room.roomNumber}.`);
    this.dispatchMutation('DELETE', 'rooms', { id });
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DORMER MANAGEMENT (Students, Employees, Visitors)
  // ─────────────────────────────────────────────────────────────
  public getDormers(): Dormer[] {
    return this.getItem<Dormer[]>('dormers', INITIAL_DORMERS);
  }

  public getDormerById(id: string): Dormer | undefined {
    return this.getDormers().find((d) => d.id === id);
  }

  public addDormer(dormerData: Omit<Dormer, 'id' | 'createdAt' | 'updatedAt'>): Dormer {
    const dormers = this.getDormers();
    // Unique email validation
    const existing = dormers.find(
      (d) => d.email.toLowerCase() === dormerData.email.trim().toLowerCase() && d.status === 'active'
    );
    if (existing) {
      toast.error('Duplicate Email Address', `An active dormer with email ${dormerData.email} is already registered.`);
      return null as any;
    }

    const newId = generateUUID();
    const newDormer: Dormer = {
      ...dormerData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dormers.unshift(newDormer);
    this.setItem('dormers', dormers);
    this.logActivity('CREATE_DORMER', 'dormitory', `Registered ${newDormer.type} dormer: ${newDormer.firstName} ${newDormer.lastName}.`);

    // Sync to Supabase cloud
    const payload = {
      id: newDormer.id,
      type: newDormer.type,
      first_name: newDormer.firstName,
      last_name: newDormer.lastName,
      email: newDormer.email,
      contact_no: newDormer.contactNo,
      gender: newDormer.gender,
      emergency_name: newDormer.emergencyName,
      emergency_contact: newDormer.emergencyContact,
      emergency_relationship: newDormer.emergencyRelationship,
      photo_url: newDormer.photoUrl,
      student_id_no: newDormer.studentIdNo,
      year_level: newDormer.yearLevel,
      section: newDormer.section,
      course: newDormer.course,
      employee_id_no: newDormer.employeeIdNo,
      department: newDormer.department,
      position: newDormer.position,
      external_id: newDormer.externalId,
      organization: newDormer.organization,
      purpose_of_stay: newDormer.purposeOfStay,
      expected_departure: newDormer.expectedDeparture,
      status: newDormer.status,
      created_at: newDormer.createdAt,
      updated_at: newDormer.updatedAt,
    };

    this.dispatchMutation('INSERT', 'dormers', payload);
    return newDormer;
  }

  public bulkAddDormers(incomingDormers: Partial<Dormer>[], type: DormerType): number {
    const dormers = this.getDormers();
    let count = 0;

    const batchPayloads: any[] = [];

    incomingDormers.forEach((item) => {
      if (item.firstName && item.lastName && item.email) {
        const isDuplicate = dormers.some(
          (d) => d.email.toLowerCase() === item.email?.trim().toLowerCase() && d.status === 'active'
        );
        if (isDuplicate) return;

        const newId = generateUUID();
        const newDormer: Dormer = {
          id: newId,
          type,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          contactNo: item.contactNo || '',
          gender: item.gender || 'prefer_not_to_say',
          emergencyName: item.emergencyName || 'None Listed',
          emergencyContact: item.emergencyContact || 'N/A',
          emergencyRelationship: item.emergencyRelationship || '',
          status: 'active',
          studentIdNo: item.studentIdNo,
          yearLevel: item.yearLevel,
          section: item.section,
          course: item.course,
          employeeIdNo: item.employeeIdNo,
          department: item.department,
          position: item.position,
          externalId: item.externalId,
          organization: item.organization,
          purposeOfStay: item.purposeOfStay,
          expectedDeparture: item.expectedDeparture,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dormers.unshift(newDormer);
        count++;

        batchPayloads.push({
          id: newDormer.id,
          type: newDormer.type,
          first_name: newDormer.firstName,
          last_name: newDormer.lastName,
          email: newDormer.email,
          contact_no: newDormer.contactNo,
          gender: newDormer.gender,
          emergency_name: newDormer.emergencyName,
          emergency_contact: newDormer.emergencyContact,
          emergency_relationship: newDormer.emergencyRelationship,
          student_id_no: newDormer.studentIdNo,
          year_level: newDormer.yearLevel,
          section: newDormer.section,
          course: newDormer.course,
          employee_id_no: newDormer.employeeIdNo,
          department: newDormer.department,
          position: newDormer.position,
          external_id: newDormer.externalId,
          organization: newDormer.organization,
          purpose_of_stay: newDormer.purposeOfStay,
          expected_departure: newDormer.expectedDeparture,
          status: newDormer.status,
          created_at: newDormer.createdAt,
          updated_at: newDormer.updatedAt,
        });
      }
    });

    if (batchPayloads.length > 0) {
      this.dispatchMutation('UPSERT', 'dormers', batchPayloads);
    }

    this.setItem('dormers', dormers);
    this.logActivity('BULK_IMPORT_DORMERS', 'dormitory', `Imported ${count} ${type} records via CSV upload.`);
    return count;
  }

  public updateDormer(id: string, updates: Partial<Dormer>): void {
    const dormers = this.getDormers();
    const idx = dormers.findIndex((d) => d.id === id);
    if (idx !== -1) {
      dormers[idx] = { ...dormers[idx], ...updates, updatedAt: new Date().toISOString() };
      this.setItem('dormers', dormers);
      this.logActivity('UPDATE_DORMER', 'dormitory', `Updated profile of ${dormers[idx].firstName} ${dormers[idx].lastName}.`);

      const mapped: any = { updated_at: dormers[idx].updatedAt };
      if (updates.firstName !== undefined) mapped.first_name = updates.firstName;
      if (updates.lastName !== undefined) mapped.last_name = updates.lastName;
      if (updates.email !== undefined) mapped.email = updates.email;
      if (updates.contactNo !== undefined) mapped.contact_no = updates.contactNo;
      if (updates.gender !== undefined) mapped.gender = updates.gender;
      if (updates.emergencyName !== undefined) mapped.emergency_name = updates.emergencyName;
      if (updates.emergencyContact !== undefined) mapped.emergency_contact = updates.emergencyContact;
      if (updates.emergencyRelationship !== undefined) mapped.emergency_relationship = updates.emergencyRelationship;
      if (updates.studentIdNo !== undefined) mapped.student_id_no = updates.studentIdNo;
      if (updates.yearLevel !== undefined) mapped.year_level = updates.yearLevel;
      if (updates.section !== undefined) mapped.section = updates.section;
      if (updates.course !== undefined) mapped.course = updates.course;
      if (updates.employeeIdNo !== undefined) mapped.employee_id_no = updates.employeeIdNo;
      if (updates.department !== undefined) mapped.department = updates.department;
      if (updates.position !== undefined) mapped.position = updates.position;
      if (updates.externalId !== undefined) mapped.external_id = updates.externalId;
      if (updates.organization !== undefined) mapped.organization = updates.organization;
      if (updates.purposeOfStay !== undefined) mapped.purpose_of_stay = updates.purposeOfStay;
      if (updates.expectedDeparture !== undefined) mapped.expected_departure = updates.expectedDeparture;
      if (updates.status !== undefined) mapped.status = updates.status;

      this.dispatchMutation('UPDATE', 'dormers', { id, data: mapped });
    }
  }

  public deleteDormer(id: string): void {
    const dormers = this.getDormers();
    const dormer = dormers.find((d) => d.id === id);
    if (!dormer) return;

    // Release bed if occupied
    if (dormer.currentAssignment?.roomId) {
      this.checkoutDormer(dormer.id);
    }

    const filtered = dormers.filter((d) => d.id !== id);
    this.setItem('dormers', filtered);
    this.logActivity('DELETE_DORMER', 'dormitory', `Removed ${dormer.firstName} ${dormer.lastName} from system.`);
    this.dispatchMutation('DELETE', 'dormers', { id });
  }

  // --- ROOM ASSIGNMENT / CHECK-IN / CHECKOUT ---
  public assignDormerToBed(
    dormerId: string,
    roomId: string,
    bedSlotId: string,
    skipSyncMutation: boolean = false
  ): boolean {
    const dormers = this.getDormers();
    const rooms = this.getRooms();

    const dormer = dormers.find((d) => d.id === dormerId);
    const room = rooms.find((r) => r.id === roomId);
    if (!dormer || !room) return false;

    const slot = room.bedSlots.find((s) => s.id === bedSlotId);
    if (!slot) return false;

    // Check conflict
    if (slot.isOccupied && slot.currentDormerId && slot.currentDormerId !== dormerId) {
      toast.error('Bed Slot Occupied', `Bed slot ${slot.slotLabel} in Room ${room.roomNumber} is already occupied!`);
      return false;
    }

    // Release any previous bed of this dormer
    if (dormer.currentAssignment?.bedSlotId) {
      this.releaseBedSlot(dormer.currentAssignment.roomId, dormer.currentAssignment.bedSlotId);
    }

    // Update bed slot
    slot.isOccupied = true;
    slot.currentDormerId = dormer.id;
    slot.currentDormerName = `${dormer.firstName} ${dormer.lastName}`;
    this.setItem('rooms', rooms);

    // Update dormer record
    const asgId = generateUUID();
    const checkInDate = new Date().toISOString().split('T')[0];
    dormer.currentAssignment = {
      id: asgId,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedSlotId: slot.id,
      slotLabel: slot.slotLabel,
      checkInDate,
    };
    dormer.status = 'active';
    this.setItem('dormers', dormers);

    // Sync atomic assignment via server handler if not part of a transfer
    if (!skipSyncMutation) {
      this.dispatchMutation('ASSIGN_BED', 'room_assignments', {
        dormerId: dormer.id,
        roomId: room.id,
        bedSlotId: slot.id,
        checkInDate,
      });
    }

    this.logActivity(
      'CHECK_IN',
      'dormitory',
      `Checked in ${dormer.firstName} ${dormer.lastName} to Room ${room.roomNumber} (${slot.slotLabel}).`
    );
    return true;
  }

  public checkoutDormer(dormerId: string, notes?: string): boolean {
    const dormers = this.getDormers();
    const dormer = dormers.find((d) => d.id === dormerId);
    if (!dormer || !dormer.currentAssignment) return false;

    const { roomId, roomNumber, bedSlotId, slotLabel } = dormer.currentAssignment;
    this.releaseBedSlot(roomId, bedSlotId);

    dormer.currentAssignment = undefined;
    dormer.status = 'checked_out';
    this.setItem('dormers', dormers);

    // Sync atomic checkout via server handler
    this.dispatchMutation('CHECKOUT_DORMER', 'room_assignments', {
      dormerId,
      roomId,
      bedSlotId,
    });

    this.logActivity(
      'CHECK_OUT',
      'dormitory',
      `Checked out ${dormer.firstName} ${dormer.lastName} from Room ${roomNumber} (${slotLabel || 'Bed'}). ${notes || ''}`
    );
    return true;
  }

  public transferDormer(dormerId: string, newRoomId: string, newBedSlotId: string): boolean {
    const dormers = this.getDormers();
    const dormer = dormers.find((d) => d.id === dormerId);
    if (!dormer) return false;

    const oldRoomNumber = dormer.currentAssignment?.roomNumber || 'None';
    const oldBedSlotId = dormer.currentAssignment?.bedSlotId;

    // Call assignDormerToBed with skipSyncMutation = true to prevent duplicate assignment insertion
    const success = this.assignDormerToBed(dormerId, newRoomId, newBedSlotId, true);
    if (success) {
      this.dispatchMutation('TRANSFER_BED', 'room_assignments', {
        dormerId,
        oldBedSlotId,
        newRoomId,
        newBedSlotId,
        checkInDate: new Date().toISOString().split('T')[0],
      });
      this.logActivity(
        'TRANSFER_DORMER',
        'dormitory',
        `Transferred ${dormer.firstName} ${dormer.lastName} from Room ${oldRoomNumber} to new room assignment.`
      );
    }
    return success;
  }

  private releaseBedSlot(roomId: string, bedSlotId?: string): void {
    if (!bedSlotId) return;
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      const slot = room.bedSlots.find((s) => s.id === bedSlotId);
      if (slot) {
        slot.isOccupied = false;
        slot.currentDormerId = undefined;
        slot.currentDormerName = undefined;
        this.setItem('rooms', rooms);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. INVENTORY & CATALOG MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  public getCategories(): InventoryCategory[] {
    const categories = this.getItem<InventoryCategory[]>('categories', INITIAL_CATEGORIES);
    const items = this.getItems();
    return categories.map((cat) => ({
      ...cat,
      itemCount: items.filter((i) => i.categoryId === cat.id).length,
    }));
  }

  public getItems(): InventoryItem[] {
    return this.getItem<InventoryItem[]>('items', INITIAL_ITEMS);
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.getItems().find((i) => i.id === id);
  }

  public async addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'qrCodeData' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    const items = this.getItems();
    const newId = generateUUID();
    const qrData = `DIMS:ASR:${itemData.itemCode}:${newId}`;

    const newItem: InventoryItem = {
      ...itemData,
      id: newId,
      qrCodeData: qrData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    this.setItem('items', items);
    this.logActivity('CREATE_ITEM', 'inventory', `Added catalog item: ${newItem.name} (${newItem.itemCode}).`);

    this.dispatchMutation('INSERT', 'items', {
      id: newItem.id,
      category_id: newItem.categoryId,
      item_code: newItem.itemCode,
      name: newItem.name,
      description: newItem.description,
      unit: newItem.unit,
      min_stock: newItem.minStock,
      current_stock: newItem.currentStock,
      location: newItem.location,
      photo_url: newItem.photoUrl,
      qr_code_data: newItem.qrCodeData,
      is_active: newItem.isActive,
    });

    return newItem;
  }

  public updateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
    const items = this.getItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
      this.setItem('items', items);
      this.logActivity('UPDATE_ITEM', 'inventory', `Updated inventory item: ${items[idx].name}.`);

      const mapped: any = { updated_at: items[idx].updatedAt };
      if (updates.name !== undefined) mapped.name = updates.name;
      if (updates.itemCode !== undefined) mapped.item_code = updates.itemCode;
      if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
      if (updates.description !== undefined) mapped.description = updates.description;
      if (updates.unit !== undefined) mapped.unit = updates.unit;
      if (updates.minStock !== undefined) mapped.min_stock = updates.minStock;
      if (updates.currentStock !== undefined) mapped.current_stock = updates.currentStock;
      if (updates.location !== undefined) mapped.location = updates.location;
      if (updates.isActive !== undefined) mapped.is_active = updates.isActive;

      this.dispatchMutation('UPDATE', 'items', { id, data: mapped });
    }
  }

  public deleteInventoryItem(id: string): void {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const filtered = items.filter((i) => i.id !== id);
    this.setItem('items', filtered);
    this.logActivity('DELETE_ITEM', 'inventory', `Removed ${item.name} (${item.itemCode}) from catalog.`);
    this.dispatchMutation('DELETE', 'items', { id });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. STOCK TRANSACTIONS & ASSET MOVEMENTS
  // ─────────────────────────────────────────────────────────────
  public getTransactions(): StockTransaction[] {
    return this.getItem<StockTransaction[]>('transactions', INITIAL_TRANSACTIONS);
  }

  public recordStockTransaction(params: {
    itemId: string;
    type: StockTransactionType;
    quantity: number;
    referenceNo?: string;
    supplier?: string;
    purpose?: string;
    issuedTo?: string;
    dormerId?: string;
    roomId?: string;
    condition?: ItemCondition;
    notes?: string;
  }): boolean {
    const items = this.getItems();
    const item = items.find((i) => i.id === params.itemId);
    if (!item) return false;

    if (params.type === 'out' && item.currentStock < params.quantity) {
      toast.error('Insufficient Stock', `Available: ${item.currentStock}, Requested: ${params.quantity}`);
      return false;
    }

    // Update item stock
    if (params.type === 'in') {
      item.currentStock += params.quantity;
    } else if (params.type === 'out') {
      item.currentStock -= params.quantity;
    } else if (params.type === 'return') {
      item.currentStock += params.quantity;
    }
    this.setItem('items', items);

    // Look up room / dormer names for ledger
    let roomNumber: string | undefined;
    if (params.roomId) {
      const r = this.getRooms().find((rm) => rm.id === params.roomId);
      roomNumber = r?.roomNumber;
    }

    let dormerName: string | undefined;
    if (params.dormerId) {
      const d = this.getDormers().find((dm) => dm.id === params.dormerId);
      dormerName = d ? `${d.firstName} ${d.lastName}` : undefined;
    }

    const tx: StockTransaction = {
      id: generateUUID(),
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      type: params.type,
      quantity: params.quantity,
      referenceNo: params.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
      supplier: params.supplier,
      purpose: params.purpose,
      issuedTo: params.issuedTo || dormerName,
      dormerId: params.dormerId,
      dormerName,
      roomId: params.roomId,
      roomNumber,
      condition: params.condition || 'good',
      notes: params.notes,
      performedBy: this.getCurrentUser().fullName,
      createdAt: new Date().toISOString(),
    };

    const transactions = this.getTransactions();
    transactions.unshift(tx);
    this.setItem('transactions', transactions);

    // If issued to a room, also track in room inventory (deductInventory = false since already deducted above)
    if (params.type === 'out' && params.roomId && roomNumber) {
      this.assignItemToRoom(params.roomId, roomNumber, item.id, item.name, item.itemCode, params.quantity, params.condition || 'good', false);
    }

    // Sync item stock change to cloud
    this.dispatchMutation('UPDATE', 'items', {
      id: item.id,
      data: { current_stock: item.currentStock },
    });

    // Sync stock transaction record to cloud
    this.dispatchMutation('INSERT', 'stock_transactions', {
      id: tx.id,
      item_id: tx.itemId,
      type: tx.type,
      quantity: tx.quantity,
      reference_no: tx.referenceNo,
      supplier: tx.supplier,
      purpose: tx.purpose,
      issued_to: tx.issuedTo,
      dormer_id: tx.dormerId,
      room_id: tx.roomId,
      condition: tx.condition,
      notes: tx.notes,
      created_at: tx.createdAt,
    });

    this.logActivity(
      `STOCK_${params.type.toUpperCase()}`,
      'inventory',
      `${params.type.toUpperCase()}: ${params.quantity} ${item.unit} of ${item.name} (${item.itemCode}). Balance: ${item.currentStock}`
    );

    return true;
  }

  // --- ROOM INVENTORY ASSETS ---
  public getRoomInventory(): RoomInventoryItem[] {
    return this.getItem<RoomInventoryItem[]>('room_inventory', INITIAL_ROOM_INVENTORY);
  }

  public assignItemToRoom(
    roomId: string,
    roomNumber: string,
    itemId: string,
    itemName: string,
    itemCode: string,
    quantity: number,
    condition: ItemCondition = 'good',
    deductInventory: boolean = true
  ): void {
    const list = this.getRoomInventory();
    const existing = list.find((ri) => ri.roomId === roomId && ri.itemId === itemId && !ri.returnedAt);

    if (existing) {
      existing.quantity += quantity;
      existing.condition = condition;
      this.dispatchMutation('UPDATE', 'room_inventory', {
        id: existing.id,
        data: { quantity: existing.quantity, condition },
      });
    } else {
      const newEntry: RoomInventoryItem = {
        id: generateUUID(),
        roomId,
        roomNumber,
        itemId,
        itemName,
        itemCode,
        quantity,
        condition,
        assignedAt: new Date().toISOString().split('T')[0],
        assignedBy: this.getCurrentUser().fullName,
      };
      list.unshift(newEntry);
      this.dispatchMutation('INSERT', 'room_inventory', {
        id: newEntry.id,
        room_id: roomId,
        item_id: itemId,
        quantity,
        condition,
        assigned_at: newEntry.assignedAt,
      });
    }

    this.setItem('room_inventory', list);

    // If assigned directly (outside stock-out modal), deduct item inventory stock
    if (deductInventory) {
      const items = this.getItems();
      const item = items.find((i) => i.id === itemId);
      if (item) {
        item.currentStock = Math.max(0, item.currentStock - quantity);
        this.setItem('items', items);
        this.dispatchMutation('UPDATE', 'items', {
          id: item.id,
          data: { current_stock: item.currentStock },
        });
      }
    }
  }

  public returnItemFromRoom(roomInventoryId: string, returnQty: number, condition: ItemCondition): boolean {
    const list = this.getRoomInventory();
    const itemEntry = list.find((ri) => ri.id === roomInventoryId);
    if (!itemEntry) return false;

    if (returnQty > itemEntry.quantity) {
      toast.error('Invalid Return Quantity', `Cannot return more than assigned quantity (${itemEntry.quantity}).`);
      return false;
    }

    if (returnQty === itemEntry.quantity) {
      itemEntry.returnedAt = new Date().toISOString();
      this.dispatchMutation('UPDATE', 'room_inventory', {
        id: itemEntry.id,
        data: { returned_at: itemEntry.returnedAt, condition },
      });
    } else {
      itemEntry.quantity -= returnQty;
      this.dispatchMutation('UPDATE', 'room_inventory', {
        id: itemEntry.id,
        data: { quantity: itemEntry.quantity },
      });
    }

    this.setItem('room_inventory', list);

    // Put back into inventory stock via official stock return ledger
    this.recordStockTransaction({
      itemId: itemEntry.itemId,
      type: 'return',
      quantity: returnQty,
      referenceNo: `RET-${itemEntry.roomNumber}`,
      roomId: itemEntry.roomId,
      purpose: `Returned asset from Room ${itemEntry.roomNumber}`,
      condition,
    });

    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. VISITOR LOGS & CAMPUS SECURITY REGISTER
  // ─────────────────────────────────────────────────────────────
  public getVisitorLogs(): VisitorLog[] {
    return this.getItem<VisitorLog[]>('visitor_logs', INITIAL_VISITOR_LOGS);
  }

  public addVisitorLog(logData: Omit<VisitorLog, 'id' | 'loggedBy' | 'createdAt'>): VisitorLog {
    const logs = this.getVisitorLogs();
    const newLog: VisitorLog = {
      ...logData,
      id: generateUUID(),
      loggedBy: this.getCurrentUser().fullName,
      createdAt: new Date().toISOString(),
    };

    logs.unshift(newLog);
    this.setItem('visitor_logs', logs);
    this.logActivity('VISITOR_ENTRY', 'dormitory', `Logged visitor: ${newLog.visitorName} (Purpose: ${newLog.purpose}).`);

    this.dispatchMutation('INSERT', 'visitor_logs', {
      id: newLog.id,
      visitor_name: newLog.visitorName,
      contact: newLog.contact,
      purpose: newLog.purpose,
      dormer_visited_id: newLog.dormerVisitedId,
      time_in: newLog.timeIn,
      time_out: newLog.timeOut,
      notes: newLog.notes,
      created_at: newLog.createdAt,
    });

    return newLog;
  }

  public markVisitorTimeOut(id: string): void {
    const logs = this.getVisitorLogs();
    const log = logs.find((l) => l.id === id);
    if (log) {
      log.timeOut = new Date().toISOString();
      this.setItem('visitor_logs', logs);
      this.logActivity('VISITOR_EXIT', 'dormitory', `Visitor ${log.visitorName} checked out at ${new Date().toLocaleTimeString()}.`);

      this.dispatchMutation('UPDATE', 'visitor_logs', {
        id,
        data: { time_out: log.timeOut },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. ANNOUNCEMENTS & BREVO BULK EMAIL ENGINE
  // ─────────────────────────────────────────────────────────────
  public getAnnouncements(): Announcement[] {
    return this.getItem<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  }

  public async sendAnnouncement(params: {
    title: string;
    body: string;
    targetAudience: 'all' | 'students' | 'employees' | 'visitors' | 'room';
    targetRoomId?: string;
    targetRoomNumber?: string;
  }): Promise<{ success: boolean; sentCount: number; message: string }> {
    const dormers = this.getDormers();
    let targetDormers = dormers.filter((d) => d.status === 'active');

    if (params.targetAudience === 'students') {
      targetDormers = targetDormers.filter((d) => d.type === 'student');
    } else if (params.targetAudience === 'employees') {
      targetDormers = targetDormers.filter((d) => d.type === 'employee');
    } else if (params.targetAudience === 'visitors') {
      targetDormers = targetDormers.filter((d) => d.type === 'visitor');
    } else if (params.targetAudience === 'room' && params.targetRoomId) {
      targetDormers = targetDormers.filter((d) => d.currentAssignment?.roomId === params.targetRoomId);
    }

    if (targetDormers.length === 0) {
      return {
        success: false,
        sentCount: 0,
        message: 'No active dormers matched the selected target audience.',
      };
    }

    const recipients = targetDormers.map((d) => ({
      email: d.email,
      name: `${d.firstName} ${d.lastName}`,
    }));

    const settings = this.getSettings();

    // Call Brevo API
    const brevoResult = await sendBrevoAnnouncement({
      title: params.title,
      body: params.body,
      recipients,
      senderEmail: settings.brevoSenderEmail,
      senderName: settings.brevoSenderName,
      apiKey: settings.brevoApiKey,
    });

    const announcementId = generateUUID();
    const announcement: Announcement = {
      id: announcementId,
      title: params.title,
      body: params.body,
      targetAudience: params.targetAudience,
      targetRoomId: params.targetRoomId,
      targetRoomNumber: params.targetRoomNumber,
      sentToCount: brevoResult.sentCount,
      failedCount: brevoResult.failedCount,
      status: brevoResult.success ? 'sent' : 'failed',
      sentAt: new Date().toISOString(),
      brevoMessageId: brevoResult.messageId,
      createdBy: this.getCurrentUser().fullName,
      createdAt: new Date().toISOString(),
      recipients: targetDormers.map((d) => ({
        id: generateUUID(),
        announcementId,
        dormerId: d.id,
        recipientName: `${d.firstName} ${d.lastName}`,
        email: d.email,
        status: brevoResult.success ? 'sent' : 'failed',
      })),
    };

    const announcements = this.getAnnouncements();
    announcements.unshift(announcement);
    this.setItem('announcements', announcements);

    this.dispatchMutation('INSERT', 'announcements', {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      target_audience: announcement.targetAudience,
      sent_to_count: announcement.sentToCount,
      failed_count: announcement.failedCount,
      status: announcement.status,
      sent_at: announcement.sentAt,
      brevo_message_id: announcement.brevoMessageId,
      created_by: announcement.createdBy,
      created_at: announcement.createdAt,
    });

    this.logActivity(
      'SEND_ANNOUNCEMENT',
      'announcements',
      `Sent announcement "${params.title}" to ${brevoResult.sentCount} dormers (${params.targetAudience}). ${brevoResult.details}`
    );

    return {
      success: brevoResult.success,
      sentCount: brevoResult.sentCount,
      message: brevoResult.details,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 10. ACTIVITY LOGS & IMMUTABLE AUDIT TRAIL
  // ─────────────────────────────────────────────────────────────
  public getActivityLogs(): ActivityLog[] {
    return this.getItem<ActivityLog[]>('activity_logs', INITIAL_LOGS);
  }

  public logActivity(action: string, module: ActivityLog['module'], detail: string): void {
    const logs = this.getItem<ActivityLog[]>('activity_logs', INITIAL_LOGS);
    const actorName = typeof window !== 'undefined' ? (localStorage.getItem('dims_staff_name') || this.getCurrentUser().fullName) : this.getCurrentUser().fullName;
    const newLog: ActivityLog = {
      id: generateUUID(),
      actorName,
      action,
      module,
      detail,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 entries for comprehensive campus auditing
    if (logs.length > 500) logs.pop();
    this.setItem('activity_logs', logs);

    // Sync to Supabase cloud
    this.dispatchMutation('INSERT', 'activity_logs', {
      id: newLog.id,
      actor_name: newLog.actorName,
      action: newLog.action,
      module: newLog.module,
      detail: newLog.detail,
      created_at: newLog.createdAt,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 11. DASHBOARD METRICS SUMMARY
  // ─────────────────────────────────────────────────────────────
  public getDashboardMetrics() {
    const rooms = this.getRooms();
    const dormers = this.getDormers().filter((d) => d.status === 'active');
    const items = this.getItems();
    const transactions = this.getTransactions();
    const logs = this.getActivityLogs();

    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupants = dormers.filter((d) => d.currentAssignment?.roomId).length;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;

    const availableRooms = rooms.filter((r) => r.status === 'available').length;
    const partialRooms = rooms.filter((r) => r.status === 'partial').length;
    const fullRooms = rooms.filter((r) => r.status === 'full').length;
    const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

    const studentDormers = dormers.filter((d) => d.type === 'student').length;
    const employeeDormers = dormers.filter((d) => d.type === 'employee').length;
    const visitorDormers = dormers.filter((d) => d.type === 'visitor').length;

    const lowStockItems = items.filter((i) => i.currentStock <= i.minStock && i.currentStock > 0);
    const outOfStockItems = items.filter((i) => i.currentStock === 0);
    const totalAssetsQuantity = items.reduce((acc, i) => acc + i.currentStock, 0);

    return {
      totalRooms,
      totalCapacity,
      totalOccupants,
      occupancyRate,
      roomStatusCounts: {
        available: availableRooms,
        partial: partialRooms,
        full: fullRooms,
        maintenance: maintenanceRooms,
      },
      dormerDemographics: {
        total: dormers.length,
        students: studentDormers,
        employees: employeeDormers,
        visitors: visitorDormers,
      },
      inventoryHealth: {
        totalItemsCount: items.length,
        totalAssetsQuantity,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems,
        outOfStockItems,
      },
      recentTransactions: transactions.slice(0, 6),
      recentActivityLogs: logs.slice(0, 8),
    };
  }
}

export const store = new DataStore();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    store.syncFromSupabase();
  });
  window.addEventListener('offline', () => {
    store.setSyncStatus('offline');
  });
}
