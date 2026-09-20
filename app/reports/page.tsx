'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { exportToCsv } from '@/lib/csv';
import {
  Printer,
  Download,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<
    'occupancy' | 'dormers' | 'inventory' | 'room_assets' | 'visitors'
  >('occupancy');

  const [rooms, setRooms] = useState(store.getRooms());
  const [dormers, setDormers] = useState(store.getDormers());
  const [items, setItems] = useState(store.getItems());
  const [roomInventory, setRoomInventory] = useState(store.getRoomInventory());
  const [visitorLogs, setVisitorLogs] = useState(store.getVisitorLogs());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const settings = store.getSettings();

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRooms(store.getRooms());
      setDormers(store.getDormers());
      setItems(store.getItems());
      setRoomInventory(store.getRoomInventory());
      setVisitorLogs(store.getVisitorLogs());
    });
    return unsub;
  }, []);

  // Date filtering logic
  const isDateInRange = (dateStr?: string | null) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  };

  // Filtered report datasets
  const filteredRooms = rooms.filter((r) => {
    if (!startDate && !endDate) return true;
    if (r.occupants && r.occupants.length > 0) {
      return r.occupants.some((o) => isDateInRange(o.checkInDate));
    }
    return false;
  });

  const filteredDormers = dormers.filter((d) => {
    if (!startDate && !endDate) return true;
    return isDateInRange(d.currentAssignment?.checkInDate) || isDateInRange(d.createdAt);
  });

  const filteredItems = items.filter((i) => {
    if (!startDate && !endDate) return true;
    return isDateInRange(i.updatedAt) || isDateInRange(i.createdAt);
  });

  const filteredRoomInventory = roomInventory.filter((ri) => {
    if (ri.returnedAt) return false;
    if (!startDate && !endDate) return true;
    return isDateInRange(ri.assignedAt);
  });

  const filteredVisitors = visitorLogs.filter((l) => {
    if (!startDate && !endDate) return true;
    return isDateInRange(l.timeIn);
  });

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
        Status: i.currentStock === 0 ? 'OUT_OF_STOCK' : i.currentStock <= i.minStock ? 'LOW_STOCK' : 'OK',
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

  const getDocControlRef = () => {
    const code =
      selectedReport === 'occupancy'
        ? 'OCC'
        : selectedReport === 'dormers'
        ? 'MST'
        : selectedReport === 'inventory'
        ? 'INV'
        : selectedReport === 'room_assets'
        ? 'RSA'
        : 'VIS';
    return `DOC-REF: ASR-AUD-2026-${code}-001`;
  };

  return (
    <AppShell>
      {/* Print-only letterhead — invisible on screen, visible on print */}
      <div className="print-only hidden border-b-2 border-[#141414] pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#555552]">
              Official Institutional Document
            </p>
            <h1 className="text-xl font-bold text-[#141414] mt-1">{settings.schoolName}</h1>
            <p className="text-sm text-[#555552]">{settings.campusName}</p>
            <p className="text-xs text-[#8C8C8A] mt-0.5 font-mono">{getDocControlRef()}</p>
          </div>
          <div className="text-right text-xs text-[#555552] space-y-0.5">
            <p className="font-bold text-[#141414] text-sm">DIMS — Official Audit Report</p>
            <p>Academic Year: {settings.academicYear}</p>
            <p>Generated: {formatDate(new Date().toISOString())}</p>
            <p>Period: {startDate ? formatDate(startDate) : 'Term Start'} – {endDate ? formatDate(endDate) : 'Present'}</p>
            <p className="font-medium text-[#141414]">Prepared by: {settings.dormitoryLeadName}</p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Executive Reports & Audit Suites
            </h1>
            <Badge variant="default" size="sm">
              Official Records
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Generate printable executive audits, inventory manifests, and masterlists for school administration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Selected CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report Document
          </Button>
        </div>
      </div>

      {/* Report Selector Segmented Controls */}
      <div className="no-print flex border-b border-[#E4E4E0] gap-4 overflow-x-auto pb-1">
        {[
          { id: 'occupancy' as const, label: '1. Room Occupancy Audit' },
          { id: 'dormers' as const, label: '2. Dormer Masterlist' },
          { id: 'inventory' as const, label: '3. Inventory & Assets Health' },
          { id: 'room_assets' as const, label: '4. Deployed Room Assets' },
          { id: 'visitors' as const, label: '5. Visitor Security Register' },
        ].map((rep) => (
          <button
            key={rep.id}
            type="button"
            onClick={() => setSelectedReport(rep.id)}
            className={`py-2 px-1 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              selectedReport === rep.id
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Date Range Filter Controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E4E4E0] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#141414]">Audit Period Filter:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#8C8C8A]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-minimal w-auto py-1 px-2.5 bg-[#F8F8F6]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#8C8C8A]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-minimal w-auto py-1 px-2.5 bg-[#F8F8F6]"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#DC2626] hover:underline cursor-pointer ml-1 font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="text-[11px] text-[#8C8C8A]">
          {startDate || endDate ? (
            <span className="text-[#4F46E5] font-medium">Filtered report range active ({startDate || 'Start'} to {endDate || 'Present'})</span>
          ) : (
            <span>Full academic term dataset (unfiltered)</span>
          )}
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="minimal-card p-8 bg-white border border-[#E4E4E0] shadow-md space-y-6">
        {/* Printable Official Letterhead */}
        <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="text-base font-bold text-[#141414] uppercase tracking-wide">
                {settings.schoolName}
              </h2>
            </div>
            <p className="text-xs text-[#555552]">{settings.campusName}</p>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              Office of Academic Services & Student Housing Administration · AY {settings.academicYear}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="font-mono font-bold text-[#4F46E5] text-sm">
              {getDocControlRef()}
            </span>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
            <p className="text-[10px] text-[#16A34A] font-medium flex items-center justify-start sm:justify-end gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated System Report
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#8C8C8A] mt-0.5">
              Classification: Institutional Internal Audit
            </p>
          </div>
        </div>

        {/* Report Content Body based on Selected Tab */}
        {selectedReport === 'occupancy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider">
                Dormitory Room Occupancy & Bed Allocation Audit
              </h3>
              <span className="text-xs font-mono text-[#8C8C8A]">
                Matching Rooms: {filteredRooms.length} · Capacity: {filteredRooms.reduce((s, r) => s + r.capacity, 0)} Beds
              </span>
            </div>

            <table className="w-full text-left text-xs border border-[#E4E4E0]">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                <tr>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Room</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Location</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Type</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Beds Occupied</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Current Residents</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredRooms.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2.5 font-bold font-mono">Room {r.roomNumber}</td>
                    <td className="p-2.5 text-[#555552]">
                      {r.floor}, {r.wing}
                    </td>
                    <td className="p-2.5 uppercase font-mono text-[11px]">{r.type}</td>
                    <td className="p-2.5 font-mono font-bold">
                      {r.occupants?.length || 0} / {r.capacity}
                    </td>
                    <td className="p-2.5">
                      {r.occupants && r.occupants.length > 0 ? (
                        r.occupants.map((o) => `${o.fullName} (${o.type})`).join(', ')
                      ) : (
                        <span className="text-[#8C8C8A] italic">Empty</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-medium uppercase text-[11px]">
                      {r.status}
                    </td>
                  </tr>
                ))}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8C8C8A]">
                      No rooms match the selected date range or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'dormers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider">
                Active Dormer Masterlist Register
              </h3>
              <span className="text-xs font-mono text-[#8C8C8A]">
                {filteredDormers.length} Registered Residents (Filtered)
              </span>
            </div>

            <table className="w-full text-left text-xs border border-[#E4E4E0]">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                <tr>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Dormer Name</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Type</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">ID Number</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Affiliation / Course</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Room Assignment</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredDormers.map((d) => (
                  <tr key={d.id}>
                    <td className="p-2.5 font-bold text-[#141414]">
                      {d.firstName} {d.lastName}
                    </td>
                    <td className="p-2.5 font-mono uppercase text-[11px]">{d.type}</td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {d.studentIdNo || d.employeeIdNo || d.externalId || '—'}
                    </td>
                    <td className="p-2.5 text-[#555552]">
                      {d.course || d.department || d.organization || '—'}
                    </td>
                    <td className="p-2.5 font-medium">
                      {d.currentAssignment?.roomNumber
                        ? `Room ${d.currentAssignment.roomNumber} (${d.currentAssignment.slotLabel || 'Bed'})`
                        : 'Unassigned'}
                    </td>
                    <td className="p-2.5 text-[11px] text-[#555552]">
                      {d.emergencyName} · {d.emergencyContact}
                    </td>
                  </tr>
                ))}
                {filteredDormers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8C8C8A]">
                      No dormer records match the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider">
                Inventory Stock Valuation & Health Manifest
              </h3>
              <span className="text-xs font-mono text-[#8C8C8A]">
                {filteredItems.reduce((s, i) => s + i.currentStock, 0)} Total Custody Units
              </span>
            </div>

            <table className="w-full text-left text-xs border border-[#E4E4E0]">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                <tr>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Asset Code</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Item Name</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Category</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Current Stock</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Min Alert</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Location</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredItems.map((i) => (
                  <tr key={i.id}>
                    <td className="p-2.5 font-mono font-bold text-[#4F46E5]">{i.itemCode}</td>
                    <td className="p-2.5 font-semibold text-[#141414]">{i.name}</td>
                    <td className="p-2.5 text-[#555552]">{i.categoryName}</td>
                    <td className="p-2.5 font-mono font-bold">
                      {i.currentStock} {i.unit}
                    </td>
                    <td className="p-2.5 font-mono text-[#8C8C8A]">
                      {i.minStock} {i.unit}
                    </td>
                    <td className="p-2.5 text-[#555552]">{i.location}</td>
                    <td className="p-2.5 text-right font-medium">
                      {i.currentStock === 0 ? (
                        <span className="text-[#DC2626] font-bold">OUT OF STOCK</span>
                      ) : i.currentStock <= i.minStock ? (
                        <span className="text-[#D97706] font-bold">LOW STOCK</span>
                      ) : (
                        <span className="text-[#16A34A]">ADEQUATE</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-[#8C8C8A]">
                      No inventory items found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'room_assets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider">
                Room Physical Assets Deployment Matrix
              </h3>
              <span className="text-xs font-mono text-[#8C8C8A]">
                {filteredRoomInventory.length} Assets Assigned to Dormitory Rooms
              </span>
            </div>

            <table className="w-full text-left text-xs border border-[#E4E4E0]">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                <tr>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Assigned Room</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Asset Code</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Item Name</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Quantity</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Condition</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Deployment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredRoomInventory.map((ri) => (
                  <tr key={ri.id}>
                    <td className="p-2.5 font-bold font-mono">Room {ri.roomNumber}</td>
                    <td className="p-2.5 font-mono text-[#4F46E5]">{ri.itemCode}</td>
                    <td className="p-2.5 font-semibold text-[#141414]">{ri.itemName}</td>
                    <td className="p-2.5 font-mono font-bold">{ri.quantity} units</td>
                    <td className="p-2.5 uppercase font-mono text-[10px]">{ri.condition}</td>
                    <td className="p-2.5 text-[#555552]">{formatDate(ri.assignedAt)}</td>
                  </tr>
                ))}
                {filteredRoomInventory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8C8C8A]">
                      No room assets deployment matches the selected date range filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'visitors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider">
                Visitor Security & Campus Entry Register
              </h3>
              <span className="text-xs font-mono text-[#8C8C8A]">
                {filteredVisitors.length} Filtered Visits Logged
              </span>
            </div>

            <table className="w-full text-left text-xs border border-[#E4E4E0]">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
                <tr>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Visitor Name</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Contact</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Purpose of Visit</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Host Resident</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Time In</th>
                  <th className="p-2.5 font-semibold text-[#8C8C8A]">Time Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredVisitors.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2.5 font-bold text-[#141414]">{l.visitorName}</td>
                    <td className="p-2.5 text-[#555552]">{l.contact || '—'}</td>
                    <td className="p-2.5 text-[#2C2C2A]">{l.purpose}</td>
                    <td className="p-2.5 font-medium text-[#4F46E5]">
                      {l.dormerVisitedName || 'General Campus'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{formatDateTime(l.timeIn)}</td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {l.timeOut ? formatDateTime(l.timeOut) : 'Currently Inside'}
                    </td>
                  </tr>
                ))}
                {filteredVisitors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8C8C8A]">
                      No visitor entries match the selected date range filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Official 3-Tier Signatures Footer */}
        <div className="pt-10 border-t border-[#E4E4E0] grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div>
            <p className="text-[#8C8C8A] font-medium">1. Prepared and Verified by:</p>
            <div className="h-10 border-b border-[#141414] mt-4" />
            <p className="font-bold text-[#141414] mt-1.5">{settings.dormitoryLeadName}</p>
            <p className="text-[11px] text-[#8C8C8A]">ASR Dormitory Lead Representative & Custodian</p>
            <p className="text-[10px] text-[#8C8C8A]">Date: ________________________</p>
          </div>

          <div>
            <p className="text-[#8C8C8A] font-medium">2. Audited and Reviewed by:</p>
            <div className="h-10 border-b border-[#141414] mt-4" />
            <p className="font-bold text-[#141414] mt-1.5">Property & Custodial Services Officer</p>
            <p className="text-[11px] text-[#8C8C8A]">Campus Logistics & Inventory Control</p>
            <p className="text-[10px] text-[#8C8C8A]">Date: ________________________</p>
          </div>

          <div>
            <p className="text-[#8C8C8A] font-medium">3. Noted and Approved by:</p>
            <div className="h-10 border-b border-[#141414] mt-4" />
            <p className="font-bold text-[#141414] mt-1.5">Dean of Student Affairs & Services</p>
            <p className="text-[11px] text-[#8C8C8A]">{settings.schoolName}</p>
            <p className="text-[10px] text-[#8C8C8A]">Date: ________________________</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
