export type DormerType = 'student' | 'employee' | 'visitor';

export type DormerStatus = 'active' | 'checked_out' | 'on_leave' | 'transferred';

export type RoomStatus = 'available' | 'partial' | 'full' | 'maintenance';

export type RoomType = 'single' | 'double' | 'quad' | 'suite';

export type ItemCondition = 'new' | 'good' | 'fair' | 'for_repair' | 'condemned';

export type StockTransactionType = 'in' | 'out' | 'return';

export type AnnouncementAudience = 'all' | 'students' | 'employees' | 'visitors' | 'room';

export type UserRole = 'super_admin' | 'dorm_manager' | 'inventory_officer' | 'viewer';

export interface BedSlot {
  id: string;
  roomId: string;
  slotLabel: string;
  isOccupied: boolean;
  currentDormerId?: string;
  currentDormerName?: string;
}

export interface Dormer {
  id: string;
  type: DormerType;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  emergencyName: string;
  emergencyContact: string;
  emergencyRelationship?: string;
  photoUrl?: string;

  // Student specific
  studentIdNo?: string;
  yearLevel?: string;
  section?: string;
  course?: string;

  // Employee specific
  employeeIdNo?: string;
  department?: string;
  position?: string;

  // Visitor specific
  externalId?: string;
  organization?: string;
  purposeOfStay?: string;
  expectedDeparture?: string;

  status: DormerStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Active assignment metadata
  currentAssignment?: {
    id: string;
    roomId: string;
    roomNumber: string;
    bedSlotId?: string;
    slotLabel?: string;
    checkInDate: string;
  };
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: string;
  wing: string;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  monthlyRate: number;
  notes?: string;
  bedSlots: BedSlot[];
  occupants?: {
    dormerId: string;
    fullName: string;
    type: DormerType;
    email: string;
    slotLabel: string;
    checkInDate: string;
  }[];
  assignedItemsCount?: number;
}

export interface RoomAssignment {
  id: string;
  dormerId: string;
  dormerName: string;
  dormerType: DormerType;
  roomId: string;
  roomNumber: string;
  bedSlotId?: string;
  slotLabel?: string;
  checkInDate: string;
  checkOutDate?: string;
  isCurrent: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface VisitorLog {
  id: string;
  visitorName: string;
  contact: string;
  purpose: string;
  dormerVisitedId?: string;
  dormerVisitedName?: string;
  timeIn: string;
  timeOut?: string;
  notes?: string;
  loggedBy: string;
  createdAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  itemCount?: number;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  unit: string;
  minStock: number;
  currentStock: number;
  location: string;
  photoUrl?: string;
  qrCodeData: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type: StockTransactionType;
  quantity: number;
  referenceNo?: string;
  supplier?: string;
  purpose?: string;
  issuedTo?: string;
  dormerId?: string;
  dormerName?: string;
  roomId?: string;
  roomNumber?: string;
  condition?: ItemCondition;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface RoomInventoryItem {
  id: string;
  roomId: string;
  roomNumber: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  condition: ItemCondition;
  assignedAt: string;
  assignedBy: string;
  returnedAt?: string;
}

export interface AnnouncementRecipient {
  id: string;
  announcementId: string;
  dormerId: string;
  recipientName: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  targetAudience: AnnouncementAudience;
  targetRoomId?: string;
  targetRoomNumber?: string;
  sentToCount: number;
  failedCount: number;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: string;
  brevoMessageId?: string;
  createdBy: string;
  createdAt: string;
  recipients?: AnnouncementRecipient[];
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  module: 'dormitory' | 'inventory' | 'announcements' | 'settings' | 'auth';
  targetId?: string;
  detail: string;
  ipAddress?: string;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  designation: string;
  contactNo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  schoolName: string;
  campusName: string;
  academicYear: string;
  systemName: string;
  dormitoryLeadName: string;
  dormitoryLeadContact: string;
  
  // Brevo email
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  brevoSenderName?: string;

  // Supabase Cloud
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseConnected?: boolean;
}
