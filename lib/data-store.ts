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

const STORAGE_KEY_PREFIX = 'dims_asr_';

// Initial Seeds
const INITIAL_STAFF: StaffUser = {
  id: 'usr-asr-lead',
  fullName: 'Maria Joy Clemente',
  email: 'mjoy.clemente@school.edu.ph',
  role: 'super_admin',
  designation: 'ASR Head Representative & Dorm Custodian',
  isActive: true,
};

const INITIAL_SETTINGS: AppSettings = {
  schoolName: 'First Asia Institute of Technology and Humanities',
  campusName: 'ASEAN Student Residences (ASR)',
  academicYear: 'A.Y. 2026 - 2027',
  systemName: 'DIMS',
  dormitoryLeadName: 'Maria Joy Clemente',
  dormitoryLeadContact: '+63 917 555 0192',
  brevoSenderEmail:
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || 'aseanresidences@firstasia.edu.ph',
  brevoSenderName:
    process.env.NEXT_PUBLIC_BREVO_SENDER_NAME || 'ASEAN Student Residences',
  brevoApiKey: process.env.NEXT_PUBLIC_BREVO_API_KEY || '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseConnected: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
};

const INITIAL_CATEGORIES: InventoryCategory[] = [
  { id: 'cat-1', name: 'Furniture & Bedding', description: 'Beds, mattresses, study tables, chairs, wardrobes' },
  { id: 'cat-2', name: 'Electronics & Appliances', description: 'Fans, desk lamps, purifiers, emergency lights' },
  { id: 'cat-3', name: 'Safety & Medical', description: 'Fire extinguishers, first-aid kits, smoke alarms' },
  { id: 'cat-4', name: 'Cleaning & Sanitation', description: 'Waste bins, sanitizing dispensers, mop buckets' },
  { id: 'cat-5', name: 'Maintenance & Tools', description: 'Toolkits, spare padlocks, plumbing fittings' },
];

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-101',
    roomNumber: '101',
    floor: '1st Floor',
    wing: 'East Wing',
    type: 'double',
    capacity: 2,
    status: 'full',
    monthlyRate: 3500,
    notes: 'Well-ventilated corner room with garden view. Includes built-in study nook.',
    bedSlots: [
      { id: 'slot-101-a', roomId: 'room-101', slotLabel: 'Bed A (Window)', isOccupied: true, currentDormerId: 'dormer-stu-01', currentDormerName: 'Lucas Santos' },
      { id: 'slot-101-b', roomId: 'room-101', slotLabel: 'Bed B (Door)', isOccupied: true, currentDormerId: 'dormer-stu-05', currentDormerName: 'Gabriel Tan' },
    ],
  },
  {
    id: 'room-102',
    roomNumber: '102',
    floor: '1st Floor',
    wing: 'East Wing',
    type: 'double',
    capacity: 2,
    status: 'partial',
    monthlyRate: 3500,
    notes: 'Near ground floor study lounge.',
    bedSlots: [
      { id: 'slot-102-a', roomId: 'room-102', slotLabel: 'Bed A', isOccupied: true, currentDormerId: 'dormer-stu-02', currentDormerName: 'Sophia Reyes' },
      { id: 'slot-102-b', roomId: 'room-102', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: 'room-103',
    roomNumber: '103',
    floor: '1st Floor',
    wing: 'West Wing',
    type: 'single',
    capacity: 1,
    status: 'full',
    monthlyRate: 5500,
    notes: 'Dedicated single room for senior staff or faculty.',
    bedSlots: [
      { id: 'slot-103-a', roomId: 'room-103', slotLabel: 'Single Bed 1', isOccupied: true, currentDormerId: 'dormer-emp-01', currentDormerName: 'Dr. Marcus Villar' },
    ],
  },
  {
    id: 'room-104',
    roomNumber: '104',
    floor: '1st Floor',
    wing: 'West Wing',
    type: 'quad',
    capacity: 4,
    status: 'partial',
    monthlyRate: 2800,
    notes: 'Spacious quad room with 2 double bunks.',
    bedSlots: [
      { id: 'slot-104-a', roomId: 'room-104', slotLabel: 'Lower Bunk 1', isOccupied: true, currentDormerId: 'dormer-stu-03', currentDormerName: 'Daniel Ocampo' },
      { id: 'slot-104-b', roomId: 'room-104', slotLabel: 'Upper Bunk 1', isOccupied: true, currentDormerId: 'dormer-stu-04', currentDormerName: 'Chloe Mendoza' },
      { id: 'slot-104-c', roomId: 'room-104', slotLabel: 'Lower Bunk 2', isOccupied: false },
      { id: 'slot-104-d', roomId: 'room-104', slotLabel: 'Upper Bunk 2', isOccupied: false },
    ],
  },
  {
    id: 'room-105',
    roomNumber: '105',
    floor: '1st Floor',
    wing: 'North Wing',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3500,
    notes: 'Newly repainted, ready for occupancy.',
    bedSlots: [
      { id: 'slot-105-a', roomId: 'room-105', slotLabel: 'Bed A', isOccupied: false },
      { id: 'slot-105-b', roomId: 'room-105', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: 'room-201',
    roomNumber: '201',
    floor: '2nd Floor',
    wing: 'East Wing',
    type: 'double',
    capacity: 2,
    status: 'partial',
    monthlyRate: 3800,
    notes: 'Balcony access overlooking the central courtyard.',
    bedSlots: [
      { id: 'slot-201-a', roomId: 'room-201', slotLabel: 'Bed A', isOccupied: true, currentDormerId: 'dormer-emp-02', currentDormerName: 'Carmela Dela Cruz' },
      { id: 'slot-201-b', roomId: 'room-201', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
  {
    id: 'room-202',
    roomNumber: '202',
    floor: '2nd Floor',
    wing: 'East Wing',
    type: 'suite',
    capacity: 2,
    status: 'full',
    monthlyRate: 7000,
    notes: 'Executive suite with private en-suite bathroom, dedicated for official guests & visitors.',
    bedSlots: [
      { id: 'slot-202-a', roomId: 'room-202', slotLabel: 'Suite Bed 1', isOccupied: true, currentDormerId: 'dormer-vis-01', currentDormerName: 'Prof. David Kim' },
      { id: 'slot-202-b', roomId: 'room-202', slotLabel: 'Suite Bed 2', isOccupied: true, currentDormerId: 'dormer-vis-02', currentDormerName: 'Elena Rostova' },
    ],
  },
  {
    id: 'room-203',
    roomNumber: '203',
    floor: '2nd Floor',
    wing: 'West Wing',
    type: 'single',
    capacity: 1,
    status: 'maintenance',
    monthlyRate: 5500,
    notes: 'Undergoing bathroom plumbing repairs. Reopening next week.',
    bedSlots: [
      { id: 'slot-203-a', roomId: 'room-203', slotLabel: 'Single Bed', isOccupied: false },
    ],
  },
  {
    id: 'room-204',
    roomNumber: '204',
    floor: '2nd Floor',
    wing: 'West Wing',
    type: 'quad',
    capacity: 4,
    status: 'partial',
    monthlyRate: 3000,
    notes: '2nd floor quad room with air conditioning unit.',
    bedSlots: [
      { id: 'slot-204-a', roomId: 'room-204', slotLabel: 'Lower Bed A', isOccupied: true, currentDormerId: 'dormer-emp-03', currentDormerName: 'Engr. Joaquin Ramos' },
      { id: 'slot-204-b', roomId: 'room-204', slotLabel: 'Upper Bed A', isOccupied: false },
      { id: 'slot-204-c', roomId: 'room-204', slotLabel: 'Lower Bed B', isOccupied: false },
      { id: 'slot-204-d', roomId: 'room-204', slotLabel: 'Upper Bed B', isOccupied: false },
    ],
  },
  {
    id: 'room-205',
    roomNumber: '205',
    floor: '2nd Floor',
    wing: 'North Wing',
    type: 'double',
    capacity: 2,
    status: 'available',
    monthlyRate: 3800,
    notes: 'Fully furnished, pristine condition.',
    bedSlots: [
      { id: 'slot-205-a', roomId: 'room-205', slotLabel: 'Bed A', isOccupied: false },
      { id: 'slot-205-b', roomId: 'room-205', slotLabel: 'Bed B', isOccupied: false },
    ],
  },
];

const INITIAL_DORMERS: Dormer[] = [
  // 5 STUDENTS
  {
    id: 'dormer-stu-01',
    type: 'student',
    firstName: 'Lucas',
    lastName: 'Santos',
    email: 'lucas.santos@student.school.edu.ph',
    contactNo: '+63 917 123 4567',
    gender: 'male',
    emergencyName: 'Maria Santos',
    emergencyContact: '+63 918 123 4567',
    emergencyRelationship: 'Mother',
    studentIdNo: 'STU-2024-0182',
    yearLevel: '3rd Year',
    section: 'BSIT-3A',
    course: 'BS Information Technology',
    status: 'active',
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-10T08:00:00Z',
    currentAssignment: {
      id: 'asg-01',
      roomId: 'room-101',
      roomNumber: '101',
      bedSlotId: 'slot-101-a',
      slotLabel: 'Bed A (Window)',
      checkInDate: '2026-06-15',
    },
  },
  {
    id: 'dormer-stu-02',
    type: 'student',
    firstName: 'Sophia',
    lastName: 'Reyes',
    email: 'sophia.reyes@student.school.edu.ph',
    contactNo: '+63 917 234 5678',
    gender: 'female',
    emergencyName: 'Eduardo Reyes',
    emergencyContact: '+63 918 234 5678',
    emergencyRelationship: 'Father',
    studentIdNo: 'STU-2025-0419',
    yearLevel: '2nd Year',
    section: 'BSN-2B',
    course: 'BS Nursing',
    status: 'active',
    createdAt: '2026-06-11T09:00:00Z',
    updatedAt: '2026-06-11T09:00:00Z',
    currentAssignment: {
      id: 'asg-02',
      roomId: 'room-102',
      roomNumber: '102',
      bedSlotId: 'slot-102-a',
      slotLabel: 'Bed A',
      checkInDate: '2026-06-16',
    },
  },
  {
    id: 'dormer-stu-03',
    type: 'student',
    firstName: 'Daniel',
    lastName: 'Ocampo',
    email: 'daniel.ocampo@student.school.edu.ph',
    contactNo: '+63 917 345 6789',
    gender: 'male',
    emergencyName: 'Teresa Ocampo',
    emergencyContact: '+63 918 345 6789',
    emergencyRelationship: 'Mother',
    studentIdNo: 'STU-2023-0091',
    yearLevel: '4th Year',
    section: 'BSCE-4A',
    course: 'BS Civil Engineering',
    status: 'active',
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-12T10:00:00Z',
    currentAssignment: {
      id: 'asg-03',
      roomId: 'room-104',
      roomNumber: '104',
      bedSlotId: 'slot-104-a',
      slotLabel: 'Lower Bunk 1',
      checkInDate: '2026-06-15',
    },
  },
  {
    id: 'dormer-stu-04',
    type: 'student',
    firstName: 'Chloe',
    lastName: 'Mendoza',
    email: 'chloe.mendoza@student.school.edu.ph',
    contactNo: '+63 917 456 7890',
    gender: 'female',
    emergencyName: 'Arturo Mendoza',
    emergencyContact: '+63 918 456 7890',
    emergencyRelationship: 'Father',
    studentIdNo: 'STU-2026-0922',
    yearLevel: '1st Year',
    section: 'BSA-1C',
    course: 'BS Accountancy',
    status: 'active',
    createdAt: '2026-06-13T11:00:00Z',
    updatedAt: '2026-06-13T11:00:00Z',
    currentAssignment: {
      id: 'asg-04',
      roomId: 'room-104',
      roomNumber: '104',
      bedSlotId: 'slot-104-b',
      slotLabel: 'Upper Bunk 1',
      checkInDate: '2026-06-17',
    },
  },
  {
    id: 'dormer-stu-05',
    type: 'student',
    firstName: 'Gabriel',
    lastName: 'Tan',
    email: 'gabriel.tan@student.school.edu.ph',
    contactNo: '+63 917 567 8901',
    gender: 'male',
    emergencyName: 'Lina Tan',
    emergencyContact: '+63 918 567 8901',
    emergencyRelationship: 'Mother',
    studentIdNo: 'STU-2025-0554',
    yearLevel: '2nd Year',
    section: 'BSCS-2A',
    course: 'BS Computer Science',
    status: 'active',
    createdAt: '2026-06-14T14:00:00Z',
    updatedAt: '2026-06-14T14:00:00Z',
    currentAssignment: {
      id: 'asg-05',
      roomId: 'room-101',
      roomNumber: '101',
      bedSlotId: 'slot-101-b',
      slotLabel: 'Bed B (Door)',
      checkInDate: '2026-06-18',
    },
  },

  // 3 EMPLOYEES
  {
    id: 'dormer-emp-01',
    type: 'employee',
    firstName: 'Dr. Marcus',
    lastName: 'Villar',
    email: 'marcus.villar@school.edu.ph',
    contactNo: '+63 920 111 2233',
    gender: 'male',
    emergencyName: 'Elena Villar',
    emergencyContact: '+63 920 999 8877',
    emergencyRelationship: 'Spouse',
    employeeIdNo: 'EMP-FAC-014',
    department: 'College of Science',
    position: 'Associate Professor of Physics',
    status: 'active',
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-05-20T08:00:00Z',
    currentAssignment: {
      id: 'asg-06',
      roomId: 'room-103',
      roomNumber: '103',
      bedSlotId: 'slot-103-a',
      slotLabel: 'Single Bed 1',
      checkInDate: '2026-06-01',
    },
  },
  {
    id: 'dormer-emp-02',
    type: 'employee',
    firstName: 'Carmela',
    lastName: 'Dela Cruz',
    email: 'carmela.delacruz@school.edu.ph',
    contactNo: '+63 920 333 4455',
    gender: 'female',
    emergencyName: 'Ramon Dela Cruz',
    emergencyContact: '+63 920 888 7766',
    emergencyRelationship: 'Brother',
    employeeIdNo: 'EMP-ADM-088',
    department: 'ASR Student Services',
    position: 'Academic Support Coordinator',
    status: 'active',
    createdAt: '2026-05-22T09:00:00Z',
    updatedAt: '2026-05-22T09:00:00Z',
    currentAssignment: {
      id: 'asg-07',
      roomId: 'room-201',
      roomNumber: '201',
      bedSlotId: 'slot-201-a',
      slotLabel: 'Bed A',
      checkInDate: '2026-06-02',
    },
  },
  {
    id: 'dormer-emp-03',
    type: 'employee',
    firstName: 'Engr. Joaquin',
    lastName: 'Ramos',
    email: 'joaquin.ramos@school.edu.ph',
    contactNo: '+63 920 444 5566',
    gender: 'male',
    emergencyName: 'Beatriz Ramos',
    emergencyContact: '+63 920 777 6655',
    emergencyRelationship: 'Spouse',
    employeeIdNo: 'EMP-ENG-032',
    department: 'Campus Facilities & Operations',
    position: 'Dormitory Maintenance Engineer',
    status: 'active',
    createdAt: '2026-05-25T11:00:00Z',
    updatedAt: '2026-05-25T11:00:00Z',
    currentAssignment: {
      id: 'asg-08',
      roomId: 'room-204',
      roomNumber: '204',
      bedSlotId: 'slot-204-a',
      slotLabel: 'Lower Bed A',
      checkInDate: '2026-06-05',
    },
  },

  // 3 VISITORS
  {
    id: 'dormer-vis-01',
    type: 'visitor',
    firstName: 'Prof. David',
    lastName: 'Kim',
    email: 'd.kim@intl-research.org',
    contactNo: '+82 10 1234 5678',
    gender: 'male',
    emergencyName: 'Sarah Kim',
    emergencyContact: '+82 10 9876 5432',
    emergencyRelationship: 'Spouse',
    externalId: 'PASS-KOR-882190',
    organization: 'Seoul National University',
    purposeOfStay: 'Visiting Scholar & Field Laboratory Research',
    expectedDeparture: '2026-10-30',
    status: 'active',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    currentAssignment: {
      id: 'asg-09',
      roomId: 'room-202',
      roomNumber: '202',
      bedSlotId: 'slot-202-a',
      slotLabel: 'Suite Bed 1',
      checkInDate: '2026-09-02',
    },
  },
  {
    id: 'dormer-vis-02',
    type: 'visitor',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@unesco-eval.org',
    contactNo: '+33 6 12 34 56 78',
    gender: 'female',
    emergencyName: 'Pavel Rostov',
    emergencyContact: '+33 6 98 76 54 32',
    emergencyRelationship: 'Father',
    externalId: 'PASS-FRA-443912',
    organization: 'UNESCO Education Quality Committee',
    purposeOfStay: 'Campus Field Accreditation & Quality Audit',
    expectedDeparture: '2026-09-28',
    status: 'active',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
    currentAssignment: {
      id: 'asg-10',
      roomId: 'room-202',
      roomNumber: '202',
      bedSlotId: 'slot-202-b',
      slotLabel: 'Suite Bed 2',
      checkInDate: '2026-09-06',
    },
  },
  {
    id: 'dormer-vis-03',
    type: 'visitor',
    firstName: 'Dr. Tariq',
    lastName: 'Al-Mansoor',
    email: 'tariq.mansoor@globalhealth.org',
    contactNo: '+971 50 123 4567',
    gender: 'male',
    emergencyName: 'Fatima Mansoor',
    emergencyContact: '+971 50 765 4321',
    emergencyRelationship: 'Sister',
    externalId: 'PASS-UAE-901188',
    organization: 'Global Health Outreach Alliance',
    purposeOfStay: 'ASR Rural Health Clinic Consultation Volunteer',
    expectedDeparture: '2026-10-10',
    status: 'active',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-01',
    itemCode: 'FURN-MAT-01',
    categoryId: 'cat-1',
    categoryName: 'Furniture & Bedding',
    name: 'Single Orthopedic Foam Mattress',
    description: '4-inch high-density antibacterial single mattress with waterproof cover.',
    unit: 'pcs',
    minStock: 5,
    currentStock: 14,
    location: 'Warehouse Bay A',
    qrCodeData: 'DIMS:ITEM:FURN-MAT-01',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-02',
    itemCode: 'FURN-DSK-02',
    categoryId: 'cat-1',
    categoryName: 'Furniture & Bedding',
    name: 'Solid Hardwood Study Desk',
    description: 'Compact study table with pull-out keyboard tray and cable pass-through.',
    unit: 'units',
    minStock: 4,
    currentStock: 10,
    location: 'Warehouse Bay A',
    qrCodeData: 'DIMS:ITEM:FURN-DSK-02',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-03',
    itemCode: 'FURN-CHR-03',
    categoryId: 'cat-1',
    categoryName: 'Furniture & Bedding',
    name: 'Ergonomic Mesh Study Chair',
    description: 'Breathable high-back mesh chair with lumbar support and pneumatic height lift.',
    unit: 'units',
    minStock: 5,
    currentStock: 8,
    location: 'Warehouse Bay A',
    qrCodeData: 'DIMS:ITEM:FURN-CHR-03',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-04',
    itemCode: 'ELEC-FAN-04',
    categoryId: 'cat-2',
    categoryName: 'Electronics & Appliances',
    name: '16-inch Oscillating Wall Fan',
    description: '3-speed quiet motor fan with thermal fuse protection.',
    unit: 'units',
    minStock: 4,
    currentStock: 2, // Low stock!
    location: 'Electrical Supply Cabinet',
    qrCodeData: 'DIMS:ITEM:ELEC-FAN-04',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-05',
    itemCode: 'ELEC-LMP-05',
    categoryId: 'cat-2',
    categoryName: 'Electronics & Appliances',
    name: 'LED Eye-Care Study Lamp',
    description: 'Touch-dimmable warm/white study lamp with USB phone charging port.',
    unit: 'units',
    minStock: 6,
    currentStock: 16,
    location: 'Electrical Supply Cabinet',
    qrCodeData: 'DIMS:ITEM:ELEC-LMP-05',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-06',
    itemCode: 'SAFE-EXT-06',
    categoryId: 'cat-3',
    categoryName: 'Safety & Medical',
    name: 'ABC Dry Chemical Extinguisher 10 lbs',
    description: 'Multi-purpose chemical extinguisher certified for school facilities.',
    unit: 'cylinders',
    minStock: 4,
    currentStock: 6,
    location: 'Safety Vault & Corridor Stations',
    qrCodeData: 'DIMS:ITEM:SAFE-EXT-06',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-07',
    itemCode: 'SAFE-MED-07',
    categoryId: 'cat-3',
    categoryName: 'Safety & Medical',
    name: 'First Aid Emergency Response Box',
    description: 'Complete trauma kit: bandages, antiseptics, burn pads, digital thermometer.',
    unit: 'kits',
    minStock: 3,
    currentStock: 1, // Low stock!
    location: 'Infirmary Station B',
    qrCodeData: 'DIMS:ITEM:SAFE-MED-07',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-08',
    itemCode: 'FURN-LIN-08',
    categoryId: 'cat-1',
    categoryName: 'Furniture & Bedding',
    name: 'Cotton Bedsheet & Pillowcase Set',
    description: '300-thread count hypoallergenic white linen set for dorm beds.',
    unit: 'sets',
    minStock: 10,
    currentStock: 24,
    location: 'Linen Closet North',
    qrCodeData: 'DIMS:ITEM:FURN-LIN-08',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-09',
    itemCode: 'ELEC-PUR-09',
    categoryId: 'cat-2',
    categoryName: 'Electronics & Appliances',
    name: 'HEPA Air Purifier Medical Grade',
    description: 'High CADR true-HEPA filter unit for suites and quarantine rooms.',
    unit: 'units',
    minStock: 2,
    currentStock: 0, // Out of stock!
    location: 'Central Storage',
    qrCodeData: 'DIMS:ITEM:ELEC-PUR-09',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'item-10',
    itemCode: 'MAINT-LOK-10',
    categoryId: 'cat-5',
    categoryName: 'Maintenance & Tools',
    name: 'Brass Security Padlock with 3 Master Keys',
    description: 'Heavy duty weather-resistant lock for dorm room wardrobe compartments.',
    unit: 'pcs',
    minStock: 12,
    currentStock: 32,
    location: 'ASR Custodian Drawer',
    qrCodeData: 'DIMS:ITEM:MAINT-LOK-10',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
];

const INITIAL_ROOM_INVENTORY: RoomInventoryItem[] = [
  { id: 'ri-01', roomId: 'room-101', roomNumber: '101', itemId: 'item-01', itemName: 'Single Orthopedic Foam Mattress', itemCode: 'FURN-MAT-01', quantity: 2, condition: 'good', assignedAt: '2026-06-10', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-02', roomId: 'room-101', roomNumber: '101', itemId: 'item-02', itemName: 'Solid Hardwood Study Desk', itemCode: 'FURN-DSK-02', quantity: 2, condition: 'good', assignedAt: '2026-06-10', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-03', roomId: 'room-101', roomNumber: '101', itemId: 'item-05', itemName: 'LED Eye-Care Study Lamp', itemCode: 'ELEC-LMP-05', quantity: 2, condition: 'new', assignedAt: '2026-06-10', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-04', roomId: 'room-102', roomNumber: '102', itemId: 'item-01', itemName: 'Single Orthopedic Foam Mattress', itemCode: 'FURN-MAT-01', quantity: 2, condition: 'good', assignedAt: '2026-06-10', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-05', roomId: 'room-103', roomNumber: '103', itemId: 'item-03', itemName: 'Ergonomic Mesh Study Chair', itemCode: 'FURN-CHR-03', quantity: 1, condition: 'good', assignedAt: '2026-06-01', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-06', roomId: 'room-202', roomNumber: '202', itemId: 'item-01', itemName: 'Single Orthopedic Foam Mattress', itemCode: 'FURN-MAT-01', quantity: 2, condition: 'new', assignedAt: '2026-09-01', assignedBy: 'Maria Joy Clemente' },
  { id: 'ri-07', roomId: 'room-202', roomNumber: '202', itemId: 'item-05', itemName: 'LED Eye-Care Study Lamp', itemCode: 'ELEC-LMP-05', quantity: 2, condition: 'new', assignedAt: '2026-09-01', assignedBy: 'Maria Joy Clemente' },
];

const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-01',
    itemId: 'item-01',
    itemCode: 'FURN-MAT-01',
    itemName: 'Single Orthopedic Foam Mattress',
    type: 'in',
    quantity: 20,
    referenceNo: 'PO-2026-091',
    supplier: 'Apex Foam & Bedding Corp',
    purpose: 'New Academic Year inventory stock replenishment',
    performedBy: 'Maria Joy Clemente',
    createdAt: '2026-06-01T09:30:00Z',
  },
  {
    id: 'tx-02',
    itemId: 'item-01',
    itemCode: 'FURN-MAT-01',
    itemName: 'Single Orthopedic Foam Mattress',
    type: 'out',
    quantity: 2,
    referenceNo: 'ISSUE-RM101',
    purpose: 'Furnishing Room 101 for incoming students',
    roomId: 'room-101',
    roomNumber: '101',
    performedBy: 'Maria Joy Clemente',
    createdAt: '2026-06-10T14:00:00Z',
  },
  {
    id: 'tx-03',
    itemId: 'item-04',
    itemCode: 'ELEC-FAN-04',
    itemName: '16-inch Oscillating Wall Fan',
    type: 'out',
    quantity: 1,
    referenceNo: 'ISSUE-RM102',
    purpose: 'Replacement for noisy fan in Room 102',
    roomId: 'room-102',
    roomNumber: '102',
    performedBy: 'Maria Joy Clemente',
    createdAt: '2026-07-02T11:15:00Z',
  },
  {
    id: 'tx-04',
    itemId: 'item-05',
    itemCode: 'ELEC-LMP-05',
    itemName: 'LED Eye-Care Study Lamp',
    type: 'in',
    quantity: 20,
    referenceNo: 'PO-2026-114',
    supplier: 'LumenTech Supplies Manila',
    purpose: 'Annual supply of energy-efficient study lights',
    performedBy: 'Maria Joy Clemente',
    createdAt: '2026-08-15T10:00:00Z',
  },
];

const INITIAL_VISITOR_LOGS: VisitorLog[] = [
  {
    id: 'vlog-01',
    visitorName: 'Mrs. Cynthia Santos',
    contact: '+63 918 555 1234',
    purpose: 'Family visit & bringing academic textbooks and supplies',
    dormerVisitedId: 'dormer-stu-01',
    dormerVisitedName: 'Lucas Santos',
    timeIn: '2026-09-18T14:30:00Z',
    timeOut: '2026-09-18T17:00:00Z',
    notes: 'Checked in at Main Gate guard house with official visitor ID.',
    loggedBy: 'Maria Joy Clemente',
    createdAt: '2026-09-18T14:30:00Z',
  },
  {
    id: 'vlog-02',
    visitorName: 'Engr. Roberto Dizon',
    contact: '+63 919 777 8899',
    purpose: 'Building plumbing contractor inspection for Room 203',
    timeIn: '2026-09-19T09:00:00Z',
    notes: 'Authorized contractor badge issued for 2nd floor repairs.',
    loggedBy: 'Maria Joy Clemente',
    createdAt: '2026-09-19T09:00:00Z',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'Upcoming Electrical & Fire Safety Inspection',
    body: `Dear Dormers,\n\nPlease be advised that the ASR Facilities and Bureau of Fire Protection will conduct a joint safety inspection of all dormitory rooms on Monday from 9:00 AM to 12:00 PM.\n\nKindly ensure power extension cords are properly arranged and high-wattage cooking appliances remain strictly inside the designated pantry area.\n\nThank you for your cooperation.\nASR Dormitory Office`,
    targetAudience: 'all',
    sentToCount: 10,
    failedCount: 0,
    status: 'sent',
    sentAt: '2026-09-15T08:30:00Z',
    brevoMessageId: 'brevo-msg-882190',
    createdBy: 'Maria Joy Clemente',
    createdAt: '2026-09-15T08:15:00Z',
  },
  {
    id: 'ann-02',
    title: 'Water Cistern Cleaning & Scheduled Interruption',
    body: `Notice to all residents:\n\nThe campus water reservoir will undergo quarterly sanitation on Saturday between 1:00 PM and 4:00 PM. Water pressure will be temporarily reduced.\n\nPlease store adequate potable water in advance.`,
    targetAudience: 'students',
    sentToCount: 5,
    failedCount: 0,
    status: 'sent',
    sentAt: '2026-09-10T14:00:00Z',
    brevoMessageId: 'brevo-msg-771822',
    createdBy: 'Maria Joy Clemente',
    createdAt: '2026-09-10T13:45:00Z',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-01',
    actorName: 'Maria Joy Clemente',
    action: 'DORMER_ASSIGN',
    module: 'dormitory',
    targetId: 'dormer-vis-02',
    detail: 'Assigned Elena Rostova (UNESCO Evaluator) to Suite 202 Bed 2.',
    createdAt: '2026-09-06T09:10:00Z',
  },
  {
    id: 'log-02',
    actorName: 'Maria Joy Clemente',
    action: 'ANNOUNCEMENT_DISPATCH',
    module: 'announcements',
    targetId: 'ann-01',
    detail: 'Dispatched bulk email notice via Brevo to all 10 registered dormers regarding fire safety inspection.',
    createdAt: '2026-09-15T08:30:00Z',
  },
  {
    id: 'log-03',
    actorName: 'Maria Joy Clemente',
    action: 'STOCK_CHECK',
    module: 'inventory',
    targetId: 'item-04',
    detail: 'Identified low stock on 16-inch Oscillating Wall Fan (2 units remaining, minimum threshold: 4).',
    createdAt: '2026-09-18T16:00:00Z',
  },
];

// Helper to get / set from localStorage
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
      return JSON.parse(stored);
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

  // --- SUPABASE CLOUD DATA LAYER & OFFLINE QUEUE ---
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
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table, payload }),
      });

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
    }
  }

  public async processPendingSyncQueue(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations: queue }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
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
        if (item.action === 'INSERT') {
          await supabase.from(item.table).insert(item.payload);
        } else if (item.action === 'UPSERT') {
          await supabase.from(item.table).upsert(item.payload);
        } else if (item.action === 'UPDATE') {
          await supabase.from(item.table).update(item.payload.data).eq('id', item.payload.id);
        } else if (item.action === 'DELETE') {
          await supabase.from(item.table).delete().eq('id', item.payload.id);
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
    visitorLogs?: any[];
    announcements?: any[];
    activityLogs?: any[];
  }): void {
    if (data.rooms && data.rooms.length > 0) {
      const mappedRooms: Room[] = data.rooms.map((r: any) => ({
        id: r.id,
        roomNumber: r.room_number,
        floor: r.floor,
        wing: r.wing || '',
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

  public async syncFromSupabase(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;
    this.setSyncStatus('syncing');

    try {
      // 1. Try server-side authenticated GET /api/sync
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.applySyncData(json.data);
          await this.processPendingSyncQueue();
          this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
          this.notify();
          return;
        }
      }

      // 2. Direct Supabase client fallback
      const supabase = getSupabaseClient();
      if (!supabase) {
        this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
        return;
      }

      const [
        { data: rooms },
        { data: bedSlots },
        { data: dormers },
        { data: assignments },
        { data: categories },
        { data: items },
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
        supabase.from('visitor_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      this.applySyncData({
        rooms: rooms || undefined,
        bedSlots: bedSlots || undefined,
        dormers: dormers || undefined,
        assignments: assignments || undefined,
        categories: categories || undefined,
        items: items || undefined,
        visitorLogs: visitorLogs || undefined,
        announcements: announcements || undefined,
        activityLogs: activityLogs || undefined,
      });

      await this.processPendingSyncQueue();
      this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
      this.notify();
    } catch (err) {
      console.warn('Supabase sync notice:', err);
      this.setSyncStatus(this.getPendingQueueCount() > 0 ? 'pending' : 'synced');
    } finally {
      this.isSyncing = false;
    }
  }

  // --- SETTINGS & AUTH ---
  public getSettings(): AppSettings {
    return this.getItem<AppSettings>('settings', INITIAL_SETTINGS);
  }

  public updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();
    this.setItem('settings', { ...current, ...updates });
    this.logActivity('UPDATE_SETTINGS', 'settings', 'Updated system preferences and campus configurations.');
  }

  public getCurrentUser(): StaffUser {
    return this.getItem<StaffUser>('current_user', INITIAL_STAFF);
  }

  // --- ROOMS ---
  public getRooms(): Room[] {
    const rooms = this.getItem<Room[]>('rooms', INITIAL_ROOMS);
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
      floor: newRoom.floor,
      wing: newRoom.wing,
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
      rooms[idx] = { ...rooms[idx], ...updates };
      this.setItem('rooms', rooms);
      this.logActivity('UPDATE_ROOM', 'dormitory', `Updated Room ${rooms[idx].roomNumber} parameters.`);

      const dataToUpdate: any = {};
      if (updates.roomNumber !== undefined) dataToUpdate.room_number = updates.roomNumber;
      if (updates.floor !== undefined) dataToUpdate.floor = updates.floor;
      if (updates.wing !== undefined) dataToUpdate.wing = updates.wing;
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

  // --- DORMERS (Students, Employees, Visitors) ---
  public getDormers(): Dormer[] {
    return this.getItem<Dormer[]>('dormers', INITIAL_DORMERS);
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

        const p = {
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
        };
        this.dispatchMutation('INSERT', 'dormers', p);
      }
    });

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
  public assignDormerToBed(dormerId: string, roomId: string, bedSlotId: string): boolean {
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

    // Sync atomic assignment via server handler
    this.dispatchMutation('ASSIGN_BED', 'room_assignments', {
      dormerId: dormer.id,
      roomId: room.id,
      bedSlotId: slot.id,
      checkInDate,
    });

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

    const success = this.assignDormerToBed(dormerId, newRoomId, newBedSlotId);
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

  // --- INVENTORY ---
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

  // --- STOCK TRANSACTIONS ---
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

    // If issued to a room, also track in room inventory
    if (params.type === 'out' && params.roomId && roomNumber) {
      this.assignItemToRoom(params.roomId, roomNumber, item.id, item.name, item.itemCode, params.quantity, params.condition || 'good');
    }

    // Sync item stock change to cloud
    this.dispatchMutation('UPDATE', 'items', {
      id: item.id,
      data: { current_stock: item.currentStock },
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
    condition: ItemCondition = 'good'
  ): void {
    const list = this.getRoomInventory();
    const existing = list.find((ri) => ri.roomId === roomId && ri.itemId === itemId && !ri.returnedAt);

    if (existing) {
      existing.quantity += quantity;
    } else {
      list.unshift({
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
      });
    }

    this.setItem('room_inventory', list);
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
    } else {
      itemEntry.quantity -= returnQty;
    }

    this.setItem('room_inventory', list);

    // Put back into inventory stock
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

  // --- VISITOR LOGS ---
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

  // --- ANNOUNCEMENTS & BREVO BULK EMAIL ---
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

  // --- IMMUTABLE ACTIVITY AUDIT LOG ---
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

  // --- DASHBOARD METRICS SUMMARY ---
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
