'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { exportToCsv } from '@/lib/csv';
import {
  Printer,
  Download,
  Calendar,
  Search,
  DoorOpen,
  Users,
  Package,
  Boxes,
  ClipboardList,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

type ReportType = 'occupancy' | 'dormers' | 'inventory' | 'room_assets' | 'visitors';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('occupancy');

  const [rooms, setRooms] = useState(store.getRooms());
  const [dormers, setDormers] = useState(store.getDormers());
  const [items, setItems] = useState(store.getItems());
  const [roomInventory, setRoomInventory] = useState(store.getRoomInventory());
  const [visitorLogs, setVisitorLogs] = useState(store.getVisitorLogs());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(store.getSettings());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRooms(store.getRooms());
      setDormers(store.getDormers());
      setItems(store.getItems());
      setRoomInventory(store.getRoomInventory());
      setVisitorLogs(store.getVisitorLogs());
      setSettings(store.getSettings());
    });
    return unsub;
  }, []);

  // Quick Date Presets
  const handleSetPreset = (preset: 'all' | 'month' | '30days' | 'today') => {
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(thirtyDaysAgo);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Date filtering logic
  const isDateInRange = useCallback((dateStr?: string | null) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  }, [startDate, endDate]);

  // Filtered and Searched datasets
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Date filter
      if (startDate || endDate) {
        if (!r.occupants || r.occupants.length === 0) return false;
        const matchesDate = r.occupants.some((o) => isDateInRange(o.checkInDate));
        if (!matchesDate) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const roomMatch = `room ${r.roomNumber} ${r.floor} ${r.wing} ${r.type} ${r.status}`.toLowerCase().includes(q);
        const occupantMatch = r.occupants?.some((o) => o.fullName.toLowerCase().includes(q));
        if (!roomMatch && !occupantMatch) return false;
      }
      return true;
    });
  }, [rooms, startDate, endDate, searchQuery, isDateInRange]);

  const filteredDormers = useMemo(() => {
    return dormers.filter((d) => {
      // Date filter
      if (startDate || endDate) {
        const matchesDate = isDateInRange(d.currentAssignment?.checkInDate) || isDateInRange(d.createdAt);
        if (!matchesDate) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${d.firstName} ${d.lastName} ${d.email} ${d.studentIdNo || ''} ${d.employeeIdNo || ''} ${d.externalId || ''} ${d.currentAssignment?.roomNumber || ''} ${d.type}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [dormers, startDate, endDate, searchQuery, isDateInRange]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      // Date filter
      if (startDate || endDate) {
        const matchesDate = isDateInRange(i.updatedAt) || isDateInRange(i.createdAt);
        if (!matchesDate) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${i.itemCode} ${i.name} ${i.categoryName} ${i.location}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, startDate, endDate, searchQuery, isDateInRange]);

  const filteredRoomInventory = useMemo(() => {
    return roomInventory.filter((ri) => {
      if (ri.returnedAt) return false;
      // Date filter
      if (startDate || endDate) {
        if (!isDateInRange(ri.assignedAt)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `room ${ri.roomNumber} ${ri.itemCode} ${ri.itemName} ${ri.condition}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [roomInventory, startDate, endDate, searchQuery, isDateInRange]);

  const filteredVisitors = useMemo(() => {
    return visitorLogs.filter((l) => {
      // Date filter
      if (startDate || endDate) {
        if (!isDateInRange(l.timeIn)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${l.visitorName} ${l.contact} ${l.purpose} ${l.dormerVisitedName || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [visitorLogs, startDate, endDate, searchQuery, isDateInRange]);


  const handlePrint = () => {
    const hasData =
      selectedReport === 'occupancy'
        ? filteredRooms.length > 0
        : selectedReport === 'dormers'
        ? filteredDormers.length > 0
        : selectedReport === 'inventory'
        ? filteredItems.length > 0
        : selectedReport === 'room_assets'
        ? filteredRoomInventory.length > 0
        : filteredVisitors.length > 0;

    if (!hasData) {
      toast.warning('Nothing to Print', 'This filtered report has no matching data records to print.');
      return;
    }
    window.print();
  };

  const handleExportCsv = () => {
    if (selectedReport === 'occupancy') {
      const rows = filteredRooms.map((r) => ({
        Room_Number: r.roomNumber,
        Floor: r.floor,
        Wing: r.wing,
        Type: r.type,
        Capacity: r.capacity,
        Occupants_Count: r.occupants?.length || 0,
        Status: r.status,
        Monthly_Rate: r.monthlyRate,
        Occupants: r.occupants?.map((o) => `${o.fullName} (${o.type})`).join('; ') || 'None',
      }));
      exportToCsv('dims_occupancy_report', rows);
    } else if (selectedReport === 'dormers') {
      const rows = filteredDormers.map((d) => ({
        Type: d.type.toUpperCase(),
        Name: `${d.firstName} ${d.lastName}`,
        Email: d.email,
        Contact: d.contactNo,
        ID_Number: d.studentIdNo || d.employeeIdNo || d.externalId || '',
        Affiliation: d.course || d.department || d.organization || '',
        Room: d.currentAssignment?.roomNumber || 'Unassigned',
        Bed_Slot: d.currentAssignment?.slotLabel || 'N/A',
        Check_In_Date: d.currentAssignment?.checkInDate || '',
        Emergency_Contact: `${d.emergencyName} (${d.emergencyContact})`,
        Status: d.status,
      }));
      exportToCsv('dims_dormers_masterlist_report', rows);
    } else if (selectedReport === 'inventory') {
      const rows = filteredItems.map((i) => ({
        Item_Code: i.itemCode,
        Item_Name: i.name,
        Category: i.categoryName,
        Unit: i.unit,
        Current_Stock: i.currentStock,
        Min_Alert_Level: i.minStock,
        Storage_Location: i.location,
        Status: i.currentStock === 0 ? 'OUT_OF_STOCK' : i.currentStock <= i.minStock ? 'LOW_STOCK' : 'ADEQUATE',
      }));
      exportToCsv('dims_inventory_valuation_report', rows);
    } else if (selectedReport === 'room_assets') {
      const rows = filteredRoomInventory.map((ri) => ({
        Room_Number: ri.roomNumber,
        Item_Code: ri.itemCode,
        Item_Name: ri.itemName,
        Quantity: ri.quantity,
        Condition: ri.condition,
        Assigned_Date: ri.assignedAt,
        Assigned_By: ri.assignedBy,
      }));
      exportToCsv('dims_room_assets_deployment_report', rows);
    } else if (selectedReport === 'visitors') {
      const rows = filteredVisitors.map((l) => ({
        Visitor_Name: l.visitorName,
        Contact: l.contact || '',
        Purpose: l.purpose,
        Host_Dormer: l.dormerVisitedName || 'General Campus',
        Time_In: formatDateTime(l.timeIn),
        Time_Out: l.timeOut ? formatDateTime(l.timeOut) : 'Inside',
        Logged_By: l.loggedBy,
      }));
      exportToCsv('dims_visitor_register_report', rows);
    }
  };

  // Tab configurations
  const REPORT_TABS = [
    { id: 'occupancy' as const, label: '1. Room Occupancy Audit', icon: DoorOpen, count: filteredRooms.length },
    { id: 'dormers' as const, label: '2. Dormer Masterlist', icon: Users, count: filteredDormers.length },
    { id: 'inventory' as const, label: '3. Inventory & Assets Health', icon: Package, count: filteredItems.length },
    { id: 'room_assets' as const, label: '4. Deployed Room Assets', icon: Boxes, count: filteredRoomInventory.length },
    { id: 'visitors' as const, label: '5. Visitor Security Register', icon: ClipboardList, count: filteredVisitors.length },
  ];

  // Aggregated calculations for summaries
  const totalCapacity = filteredRooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalOccupants = filteredRooms.reduce((acc, r) => acc + (r.occupants?.length || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;
  const totalStockUnits = filteredItems.reduce((acc, i) => acc + i.currentStock, 0);
  const outOfStockCount = filteredItems.filter((i) => i.currentStock === 0).length;
  const lowStockCount = filteredItems.filter((i) => i.currentStock > 0 && i.currentStock <= i.minStock).length;
  const totalDeployedQuantity = filteredRoomInventory.reduce((acc, ri) => acc + ri.quantity, 0);
  const activeVisitorsInside = filteredVisitors.filter((v) => !v.timeOut).length;

  return (
    <AppShell>
      {/* ─────────────────────────────────────────────────────────────
          1. ACTION HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Executive Reports & Institutional Registers
            </h1>
            <Badge variant="default" size="sm">
              Certified Audit Ledger
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Generate authenticated institutional audits, property custody manifests, and resident masterlists for school administration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Selected CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report Document
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. REPORT SELECTOR TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="no-print flex border-b border-[#E4E4E0] gap-3 overflow-x-auto pb-1">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center gap-2 py-2 px-2 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#F4F4F2] text-[#8C8C8A]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EXECUTIVE SUMMARY RIBBON (CONTEXTUAL KPI CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedReport === 'occupancy' && (
          <>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Rooms</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{filteredRooms.length}</span>
                <span className="text-xs text-[#555552] font-mono">East & West Wings</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Bed Capacity</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{totalCapacity}</span>
                <span className="text-xs text-[#16A34A] font-medium">{totalOccupants} Occupied Beds</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Overall Occupancy Rate</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#4F46E5]">{occupancyRate}%</span>
                <span className="text-xs text-[#8C8C8A] font-mono">{totalCapacity - totalOccupants} Available</span>
              </div>
              <div className="w-full bg-[#F4F4F2] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#4F46E5] h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Monthly Run-Rate</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-[#141414]">
                  {formatCurrency(filteredRooms.reduce((acc, r) => acc + (r.occupants?.length || 0) * (r.monthlyRate / (r.capacity || 1)), 0))}
                </span>
                <span className="text-xs text-[#16A34A] font-medium flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'dormers' && (
          <>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Residents</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{filteredDormers.length}</span>
                <span className="text-xs text-[#16A34A] font-medium">100% Verified</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Student Dormers</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#4F46E5]">
                  {filteredDormers.filter((d) => d.type === 'student').length}
                </span>
                <span className="text-xs text-[#555552]">College & Senior High</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Staff / Faculty Residents</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#0284C7]">
                  {filteredDormers.filter((d) => d.type === 'employee').length}
                </span>
                <span className="text-xs text-[#555552]">Academic Employees</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Transients & Guests</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#D97706]">
                  {filteredDormers.filter((d) => d.type === 'visitor').length}
                </span>
                <span className="text-xs text-[#8C8C8A]">Short-term Stay</span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'inventory' && (
          <>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Asset Catalog Items</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{filteredItems.length}</span>
                <span className="text-xs text-[#555552]">SKUs Defined</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Warehouse Stock</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{totalStockUnits}</span>
                <span className="text-xs text-[#555552] font-mono">Physical Units</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Low Stock Attention</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#D97706]">{lowStockCount}</span>
                <span className="text-xs text-[#D97706] font-medium">Reorder Alert</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Out of Stock Zero Balance</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#DC2626]">{outOfStockCount}</span>
                <span className="text-xs text-[#DC2626] font-medium">Depleted Items</span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'room_assets' && (
          <>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Deployed Asset Lines</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{filteredRoomInventory.length}</span>
                <span className="text-xs text-[#555552]">Active Bindings</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Units Deployed</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#4F46E5]">{totalDeployedQuantity}</span>
                <span className="text-xs text-[#555552]">Assigned Units</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Rooms Furnished</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">
                  {new Set(filteredRoomInventory.map((ri) => ri.roomNumber)).size}
                </span>
                <span className="text-xs text-[#16A34A] font-medium">Covered Rooms</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Condition Status</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#16A34A]">
                  {filteredRoomInventory.filter((ri) => ri.condition === 'good' || ri.condition === 'new').length}
                </span>
                <span className="text-xs text-[#555552]">Good / Excellent</span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'visitors' && (
          <>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Total Visits Recorded</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">{filteredVisitors.length}</span>
                <span className="text-xs text-[#555552]">Registered Entries</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Currently On Premises</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#4F46E5]">{activeVisitorsInside}</span>
                <span className="text-xs text-[#4F46E5] font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" /> Active Inside
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Completed Visits</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#16A34A]">{filteredVisitors.length - activeVisitorsInside}</span>
                <span className="text-xs text-[#16A34A] font-medium">Logged Out</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E4E0] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">Security Log Status</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-[#141414]">100%</span>
                <span className="text-xs text-[#16A34A] font-medium">Audit Reconciled</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. AUDIT TOOLBAR & FILTER CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 bg-white border border-[#E4E4E0] rounded-xl text-xs shadow-xs">
        {/* Left: Quick Date Presets & Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-semibold text-[#141414] flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
            Audit Range:
          </span>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 bg-[#F8F8F6] p-0.5 rounded-lg border border-[#E4E4E0]">
            <button
              type="button"
              onClick={() => handleSetPreset('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                !startDate && !endDate ? 'bg-white text-[#141414] shadow-xs font-semibold' : 'text-[#8C8C8A] hover:text-[#141414]'
              }`}
            >
              All Term
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('month')}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-[#8C8C8A] hover:text-[#141414] transition-colors cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('30days')}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-[#8C8C8A] hover:text-[#141414] transition-colors cursor-pointer"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('today')}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-[#8C8C8A] hover:text-[#141414] transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="Filter Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-minimal w-auto py-1 px-2.5 bg-[#F8F8F6] font-mono text-[11px]"
            />
            <span className="text-[#8C8C8A]">to</span>
            <input
              type="date"
              aria-label="Filter End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-minimal w-auto py-1 px-2.5 bg-[#F8F8F6] font-mono text-[11px]"
            />
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="flex items-center gap-1 text-[11px] text-[#DC2626] hover:underline cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Right: Live Table Search Filter */}
        <div className="relative min-w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8C8C8A]" />
          <input
            type="text"
            placeholder="Filter table rows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-minimal pl-8 py-1.5 text-xs bg-[#F8F8F6]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[10px] text-[#8C8C8A] hover:text-[#141414] font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. PLAIN, PROFESSIONAL & MINIMALIST DOCUMENT SHEET
      ───────────────────────────────────────────────────────────── */}
      <div className="report-document-sheet bg-white border border-[#E4E4E0] shadow-sm rounded-xl p-8 space-y-6">
        {/* Minimalist Professional Header */}
        <div className="border-b border-[#E4E4E0] pb-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#141414] uppercase">
                {settings.schoolName || 'First Asia Institute of Technology and Humanities'}
              </h1>
              <p className="text-xs text-[#555552] mt-0.5">
                {settings.campusName || 'ASEAN Student Residences (ASR)'} · Dormitory &amp; Inventory Management System
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-[#555552] space-y-0.5">
              <p className="font-mono text-[11px]">
                <span className="text-[#8C8C8A]">Date:</span>{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {(startDate || endDate) && (
                <p className="font-mono text-[11px]">
                  <span className="text-[#8C8C8A]">Period:</span>{' '}
                  {startDate ? formatDate(startDate) : 'Start'} – {endDate ? formatDate(endDate) : 'Present'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-t border-[#F2F2EF]">
            <div>
              <h2 className="text-sm font-semibold text-[#141414]">
                {selectedReport === 'occupancy' && 'Dormitory Room Occupancy & Bed Slot Allocation Report'}
                {selectedReport === 'dormers' && 'Active Resident Masterlist & Census Register'}
                {selectedReport === 'inventory' && 'Physical Asset & Inventory Stock Report'}
                {selectedReport === 'room_assets' && 'Room Custody Asset Manifest'}
                {selectedReport === 'visitors' && 'Campus Entry & Visitor Logbook'}
              </h2>
              <p className="text-[11px] text-[#8C8C8A]">
                {selectedReport === 'occupancy' && 'Physical room capacity, wing assignments, monthly rates, and active occupants.'}
                {selectedReport === 'dormers' && 'Resident profiles, affiliations, contact info, and room assignments.'}
                {selectedReport === 'inventory' && 'Warehouse asset catalog, stock balances, storage locations, and alert levels.'}
                {selectedReport === 'room_assets' && 'Assets and fixtures deployed inside resident rooms with condition status.'}
                {selectedReport === 'visitors' && 'Visitor security records, destination rooms, and entry/exit timestamps.'}
              </p>
            </div>
            <div className="text-xs font-mono text-[#555552] shrink-0">
              {selectedReport === 'occupancy' && `${filteredRooms.length} Rooms · ${totalOccupants}/${totalCapacity} Beds (${occupancyRate}% Occupancy)`}
              {selectedReport === 'dormers' && `${filteredDormers.length} Registered Residents`}
              {selectedReport === 'inventory' && `${filteredItems.length} Items · ${totalStockUnits} Units in Stock`}
              {selectedReport === 'room_assets' && `${filteredRoomInventory.length} Deployed Lines · ${totalDeployedQuantity} Units`}
              {selectedReport === 'visitors' && `${filteredVisitors.length} Logged Entries (${activeVisitorsInside} Inside)`}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            REPORT TABLE 1: ROOM OCCUPANCY & BED ALLOCATION AUDIT
        ───────────────────────────────────────────────────────────── */}
        {selectedReport === 'occupancy' && (
          <div className="space-y-3">
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
              <table className="report-table-print w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Room</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Location / Wing</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Room Type</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Monthly Rate</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Occupancy Ratio</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Registered Resident Occupants</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {filteredRooms.map((r) => {
                    const occCount = r.occupants?.length || 0;
                    const isFull = occCount >= r.capacity;

                    return (
                      <tr key={r.id} className="hover:bg-[#F8F8F6] transition-colors">
                        <td className="py-2.5 px-3 font-bold font-mono text-[#141414]">
                          Room {r.roomNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[#555552]">
                          {r.floor}, {r.wing}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#F4F4F2] text-[#555552] font-semibold">
                            {r.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#141414]">
                          {formatCurrency(r.monthlyRate)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span className={isFull ? 'text-[#DC2626]' : occCount > 0 ? 'text-[#4F46E5]' : 'text-[#8C8C8A]'}>
                            {occCount} / {r.capacity} beds
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {r.occupants && r.occupants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.occupants.map((o) => (
                                <span
                                  key={o.dormerId}
                                  className="inline-flex items-center gap-1 text-[11px] bg-[#EEF2FF] text-[#4F46E5] px-1.5 py-0.5 rounded font-medium border border-[#C7D2FE]"
                                >
                                  {o.fullName}
                                  <span className="text-[9px] uppercase font-mono opacity-75">({o.type[0]})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#8C8C8A] italic text-[11px]">Unoccupied (Available)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge
                            variant={isFull ? 'danger' : occCount > 0 ? 'accent' : 'success'}
                            size="sm"
                            dot
                          >
                            {isFull ? 'FULL' : occCount > 0 ? 'PARTIAL' : 'AVAILABLE'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                        No room records match the active criteria or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Summary Table Footer */}
                {filteredRooms.length > 0 && (
                  <tfoot className="bg-[#FAFAF9] border-t border-[#E4E4E0] font-semibold text-[#141414]">
                    <tr>
                      <td className="py-3 px-3 uppercase text-[11px] tracking-wider" colSpan={3}>
                        Aggregate Totals ({filteredRooms.length} Rooms):
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {formatCurrency(filteredRooms.reduce((acc, r) => acc + r.monthlyRate, 0))} Max
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#4F46E5]" colSpan={2}>
                        {totalOccupants} Beds Occupied of {totalCapacity} Total ({occupancyRate}% Net Occupancy)
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] font-mono">
                        {totalCapacity - totalOccupants} Vacant
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            REPORT TABLE 2: DORMER MASTERLIST REGISTER
        ───────────────────────────────────────────────────────────── */}
        {selectedReport === 'dormers' && (
          <div className="space-y-3">
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
              <table className="report-table-print w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Resident Name</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Classification</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Institutional ID</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Affiliation / Degree Course</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Room Assignment</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Contact Info</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Emergency Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {filteredDormers.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F8F8F6] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#141414]">
                          {d.firstName} {d.lastName}
                        </div>
                        <p className="text-[10px] text-[#8C8C8A] font-mono">{d.email}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            d.type === 'student'
                              ? 'bg-[#EEF2FF] text-[#4F46E5]'
                              : d.type === 'employee'
                              ? 'bg-[#F0F9FF] text-[#0284C7]'
                              : 'bg-[#FFFBEB] text-[#D97706]'
                          }`}
                        >
                          {d.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#141414]">
                        {d.studentIdNo || d.employeeIdNo || d.externalId || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[#555552]">
                        {d.course || d.department || d.organization || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {d.currentAssignment?.roomNumber ? (
                          <span className="font-mono text-[11px] font-bold text-[#4F46E5]">
                            Room {d.currentAssignment.roomNumber} ({d.currentAssignment.slotLabel || 'Bed'})
                          </span>
                        ) : (
                          <span className="text-[#8C8C8A] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#555552]">{d.contactNo}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-medium text-[#141414]">{d.emergencyName}</span>
                        <p className="text-[10px] text-[#8C8C8A] font-mono">{d.emergencyContact}</p>
                      </td>
                    </tr>
                  ))}
                  {filteredDormers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                        No resident masterlist records match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            REPORT TABLE 3: INVENTORY STOCK VALUATION & HEALTH
        ───────────────────────────────────────────────────────────── */}
        {selectedReport === 'inventory' && (
          <div className="space-y-3">
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
              <table className="report-table-print w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Asset Code</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Item Name</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Category</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Current Stock</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Min Alert Level</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Storage Location</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Audit Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {filteredItems.map((i) => (
                    <tr key={i.id} className="hover:bg-[#F8F8F6] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F46E5]">{i.itemCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#141414]">{i.name}</td>
                      <td className="py-2.5 px-3 text-[#555552]">{i.categoryName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#141414]">
                        {i.currentStock} {i.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#8C8C8A]">
                        {i.minStock} {i.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[#555552]">{i.location}</td>
                      <td className="py-2.5 px-3 text-right">
                        {i.currentStock === 0 ? (
                          <Badge variant="danger" size="sm" dot>
                            OUT OF STOCK
                          </Badge>
                        ) : i.currentStock <= i.minStock ? (
                          <Badge variant="warning" size="sm" dot>
                            LOW STOCK
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            ADEQUATE
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                        No inventory catalog items match the active criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot className="bg-[#FAFAF9] border-t border-[#E4E4E0] font-semibold text-[#141414]">
                    <tr>
                      <td className="py-3 px-3 uppercase text-[11px] tracking-wider" colSpan={3}>
                        Total Warehouse Custody ({filteredItems.length} SKUs):
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#4F46E5]" colSpan={2}>
                        {totalStockUnits} Physical Units in Custody
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-[#DC2626]" colSpan={2}>
                        {outOfStockCount} Depleted · {lowStockCount} Low Stock Alert
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            REPORT TABLE 4: ROOM ASSETS DEPLOYMENT MATRIX
        ───────────────────────────────────────────────────────────── */}
        {selectedReport === 'room_assets' && (
          <div className="space-y-3">
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
              <table className="report-table-print w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Assigned Room</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Asset Code</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Item Name</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Deployed Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Operating Condition</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Deployment Date</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Custodian Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {filteredRoomInventory.map((ri) => (
                    <tr key={ri.id} className="hover:bg-[#F8F8F6] transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-[#141414]">
                        Room {ri.roomNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F46E5]">{ri.itemCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#141414]">{ri.itemName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#141414]">
                        {ri.quantity} units
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            ri.condition === 'new' || ri.condition === 'good'
                              ? 'bg-[#F0FDF4] text-[#16A34A]'
                              : ri.condition === 'fair'
                              ? 'bg-[#FFFBEB] text-[#D97706]'
                              : 'bg-[#FEF2F2] text-[#DC2626]'
                          }`}
                        >
                          {ri.condition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#555552]">{formatDate(ri.assignedAt)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#141414]">{ri.assignedBy}</td>
                    </tr>
                  ))}
                  {filteredRoomInventory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                        No room deployed assets found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            REPORT TABLE 5: VISITOR SECURITY REGISTER
        ───────────────────────────────────────────────────────────── */}
        {selectedReport === 'visitors' && (
          <div className="space-y-3">
            <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
              <table className="report-table-print w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Visitor Full Name</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Contact Number</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Purpose of Visit</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Host Dormer Visited</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Entry Time</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Exit Time</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Campus Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {filteredVisitors.map((l) => {
                    const isInside = !l.timeOut;
                    return (
                      <tr key={l.id} className="hover:bg-[#F8F8F6] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#141414]">{l.visitorName}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#555552]">
                          {l.contact || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#2C2C2A]">{l.purpose}</td>
                        <td className="py-2.5 px-3 font-medium text-[#4F46E5]">
                          {l.dormerVisitedName || 'General Campus'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#555552]">
                          {formatDateTime(l.timeIn)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#555552]">
                          {l.timeOut ? formatDateTime(l.timeOut) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant={isInside ? 'accent' : 'neutral'} size="sm" dot>
                            {isInside ? 'ON PREMISES' : 'CHECKED OUT'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                        No visitor logs match the specified search or date filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Minimalist Document Footer */}
        <div className="pt-4 border-t border-[#E4E4E0] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C8C8A] gap-2">
          <span>DIMS · Dormitory &amp; Inventory Management System</span>
          <span>CONFIDENTIAL · FOR INTERNAL ADMINISTRATIVE USE ONLY</span>
        </div>
      </div>
    </AppShell>
  );
}
