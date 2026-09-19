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

  const handlePrint = () => {
    const hasData =
      selectedReport === 'occupancy'
        ? rooms.length > 0
        : selectedReport === 'dormers'
        ? dormers.length > 0
        : selectedReport === 'inventory'
        ? items.length > 0
        : selectedReport === 'room_assets'
        ? roomInventory.filter((r) => !r.returnedAt).length > 0
        : visitorLogs.length > 0;

    if (!hasData) {
      toast.warning('Nothing to Print', 'This report has no data records to print.');
      return;
    }
    window.print();
  };

  const handleExportCsv = () => {
    if (selectedReport === 'occupancy') {
      const rows = rooms.map((r) => ({
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
      const rows = dormers.map((d) => ({
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
      const rows = items.map((i) => ({
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
      const rows = roomInventory
        .filter((ri) => !ri.returnedAt)
        .map((ri) => ({
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
      const rows = visitorLogs.map((l) => ({
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
          </div>
          <div className="text-right text-xs text-[#555552] space-y-0.5">
            <p className="font-bold text-[#141414] text-sm">DIMS — Official Report</p>
            <p>Academic Year: {settings.academicYear}</p>
            <p>Generated: {formatDate(new Date().toISOString())}</p>
            <p>Prepared by: {settings.dormitoryLeadName}</p>
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
              className="text-[11px] text-[#DC2626] hover:underline cursor-pointer ml-1"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="text-[11px] text-[#8C8C8A]">
          {startDate || endDate ? (
            <span>Filtered report range active</span>
          ) : (
            <span>Full academic term dataset</span>
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
              Academic Services Representative (ASR) Dormitory Office · {settings.academicYear}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="font-mono font-bold text-[#4F46E5] text-sm">
              {selectedReport === 'occupancy' && 'DOC-OCC-2026'}
              {selectedReport === 'dormers' && 'DOC-MST-2026'}
              {selectedReport === 'inventory' && 'DOC-INV-2026'}
              {selectedReport === 'room_assets' && 'DOC-RSA-2026'}
              {selectedReport === 'visitors' && 'DOC-VIS-2026'}
            </span>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
            <p className="text-[10px] text-[#16A34A] font-medium flex items-center justify-start sm:justify-end gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated System Report
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
                Total Rooms: {rooms.length} · Capacity: {rooms.reduce((s, r) => s + r.capacity, 0)} Beds
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
                {rooms.map((r) => (
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
                {dormers.length} Total Registered Residents
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
                {dormers.map((d) => (
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
                {items.reduce((s, i) => s + i.currentStock, 0)} Total Custody Units
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
                {items.map((i) => (
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
                Assets Assigned to Dormitory Rooms
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
                {roomInventory
                  .filter((ri) => !ri.returnedAt)
                  .map((ri) => (
                    <tr key={ri.id}>
                      <td className="p-2.5 font-bold font-mono">Room {ri.roomNumber}</td>
                      <td className="p-2.5 font-mono text-[#4F46E5]">{ri.itemCode}</td>
                      <td className="p-2.5 font-semibold text-[#141414]">{ri.itemName}</td>
                      <td className="p-2.5 font-mono font-bold">{ri.quantity} units</td>
                      <td className="p-2.5 uppercase font-mono text-[10px]">{ri.condition}</td>
                      <td className="p-2.5 text-[#555552]">{formatDate(ri.assignedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'visitors' && (() => {
          const filteredVisitors = visitorLogs.filter((l) => {
            if (startDate && new Date(l.timeIn) < new Date(startDate)) return false;
            if (endDate && new Date(l.timeIn) > new Date(endDate + 'T23:59:59')) return false;
            return true;
          });

          return (
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
          );
        })()}

        {/* Printable Official Signatures Footer */}
        <div className="pt-10 border-t border-[#E4E4E0] grid grid-cols-2 gap-12 text-xs">
          <div>
            <p className="text-[#8C8C8A]">Prepared and Verified by:</p>
            <div className="h-10 border-b border-[#141414] mt-6" />
            <p className="font-bold text-[#141414] mt-1.5">{settings.dormitoryLeadName}</p>
            <p className="text-[11px] text-[#8C8C8A]">ASR Dormitory Lead Representative & Custodian</p>
          </div>

          <div>
            <p className="text-[#8C8C8A]">Noted and Approved by:</p>
            <div className="h-10 border-b border-[#141414] mt-6" />
            <p className="font-bold text-[#141414] mt-1.5">Dean of Student Affairs & Services</p>
            <p className="text-[11px] text-[#8C8C8A]">{settings.schoolName}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
