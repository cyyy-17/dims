'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Dormer, DormerType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DormerModal } from '@/components/dormitory/DormerModal';
import { CsvImportModal } from '@/components/dormitory/CsvImportModal';
import { CheckInModal } from '@/components/dormitory/CheckInModal';
import { TransferModal } from '@/components/dormitory/TransferModal';
import { DormerProfileDrawer } from '@/components/dormitory/DormerProfileDrawer';
import { exportToCsv } from '@/lib/csv';
import {
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  Plus,
  Upload,
  Download,
  Search,
  DoorOpen,
  Edit2,
  LogOut,
  Trash2,
  Phone,
  Mail,
  ArrowRightLeft,
  Archive,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function DormersPage() {
  const [dormers, setDormers] = useState<Dormer[]>(store.getDormers());
  const [activeTab, setActiveTab] = useState<'all' | DormerType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFormer, setShowFormer] = useState(false);

  // Modals & Drawers
  const [isDormerModalOpen, setIsDormerModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerDormer, setDrawerDormer] = useState<Dormer | null>(null);
  const [selectedDormer, setSelectedDormer] = useState<Dormer | null>(null);
  const [dormerToTransfer, setDormerToTransfer] = useState<Dormer | null>(null);
  const [dormerToCheckout, setDormerToCheckout] = useState<Dormer | null>(null);
  const [dormerToDelete, setDormerToDelete] = useState<Dormer | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setDormers(store.getDormers());
    });
    return unsub;
  }, []);

  const activeDormers = dormers.filter(
    (d) => d.status !== 'checked_out' && d.status !== 'transferred'
  );
  const formerDormers = dormers.filter(
    (d) => d.status === 'checked_out' || d.status === 'transferred'
  );

  const displayPool = showFormer ? formerDormers : activeDormers;

  const counts = {
    all: displayPool.length,
    student: displayPool.filter((d) => d.type === 'student').length,
    employee: displayPool.filter((d) => d.type === 'employee').length,
    visitor: displayPool.filter((d) => d.type === 'visitor').length,
  };

  const filteredDormers = dormers.filter((d) => {
    const isFormer = d.status === 'checked_out' || d.status === 'transferred';
    if (showFormer && !isFormer) return false;
    if (!showFormer && isFormer) return false;
    if (activeTab !== 'all' && d.type !== activeTab) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        `${d.firstName} ${d.lastName} ${d.email} ${d.studentIdNo || ''} ${d.employeeIdNo || ''} ${d.externalId || ''} ${d.course || ''} ${d.department || ''} ${d.organization || ''}`
          .toLowerCase()
          .includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCheckout = (dormer: Dormer) => {
    setDormerToCheckout(dormer);
  };

  const confirmCheckoutDormer = () => {
    if (dormerToCheckout) {
      store.checkoutDormer(dormerToCheckout.id);
      toast.success('Dormer Checked Out', `${dormerToCheckout.firstName} ${dormerToCheckout.lastName} was checked out.`);
      setDormerToCheckout(null);
    }
  };

  const handleDelete = (dormer: Dormer) => {
    setDormerToDelete(dormer);
  };

  const confirmDeleteDormer = () => {
    if (dormerToDelete) {
      store.deleteDormer(dormerToDelete.id);
      toast.success('Dormer Record Removed', `Record for ${dormerToDelete.firstName} ${dormerToDelete.lastName} was deleted.`);
      setDormerToDelete(null);
    }
  };

  const handleExportCsv = () => {
    const exportRows = filteredDormers.map((d) => ({
      Type: d.type.toUpperCase(),
      Name: `${d.firstName} ${d.lastName}`,
      Email: d.email,
      Contact: d.contactNo,
      Identification: d.studentIdNo || d.employeeIdNo || d.externalId || 'N/A',
      Academic_Or_Affiliation: d.course || d.department || d.organization || 'N/A',
      Room: d.currentAssignment?.roomNumber || 'Unassigned',
      Bed_Slot: d.currentAssignment?.slotLabel || 'N/A',
      Check_In_Date: d.currentAssignment?.checkInDate || 'N/A',
      Emergency_Contact_Name: d.emergencyName,
      Emergency_Phone: d.emergencyContact,
      Status: d.status,
    }));

    exportToCsv(`dims_dormers_masterlist_${activeTab}`, exportRows);
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              {showFormer ? 'Former Residents Archive' : 'Dormers Masterlist & Profiles'}
            </h1>
            <Badge variant={showFormer ? 'neutral' : 'default'} size="sm">
              {showFormer
                ? `${formerDormers.length} Former Residents`
                : `${activeDormers.length} Active Registered`}
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            {showFormer
              ? 'Historical archive of checked-out and transferred campus residents'
              : 'Unified management for Students, Employees, and Authorized Campus Visitors'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFormer((f) => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showFormer
                ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                : 'bg-white text-[#555552] border-[#E4E4E0] hover:bg-[#F8F8F6]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {showFormer ? 'Back to Active Roster' : 'Former Residents'}
          </button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#16A34A]" />
            Bulk Import CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setSelectedDormer(null);
              setIsDormerModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Dormer
          </Button>
        </div>
      </div>

      {/* Segmented Tabs & Filters Bar */}
      <div className="space-y-3">
        {/* Type Tabs */}
        <div className="flex border-b border-[#E4E4E0] gap-4 overflow-x-auto">
          {[
            { id: 'all' as const, label: 'All Residents', count: counts.all, icon: Users },
            { id: 'student' as const, label: 'Students', count: counts.student, icon: GraduationCap },
            { id: 'employee' as const, label: 'Employees', count: counts.employee, icon: Briefcase },
            { id: 'visitor' as const, label: 'Visitors', count: counts.visitor, icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#F2F2EF] text-[#8C8C8A]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter / Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8C8A] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, student ID, employee ID, course, or email..."
                className="input-minimal pl-10!"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-minimal w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Residents</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dormers Table */}
      <div className="minimal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Dormer Info
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Classification / ID
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Affiliation / Course
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Room & Bed Slot
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Emergency Contact
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {filteredDormers.map((dormer) => {
                const isAssigned = !!dormer.currentAssignment?.roomNumber;

                return (
                  <tr
                    key={dormer.id}
                    onClick={() => {
                      setDrawerDormer(dormer);
                      setIsDrawerOpen(true);
                    }}
                    className="hover:bg-[#F8F8F6] transition-colors cursor-pointer group"
                  >
                    {/* Name & Contact */}
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-[#141414] text-sm group-hover:text-[#4F46E5] transition-colors">
                          {dormer.firstName} {dormer.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#8C8C8A] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {dormer.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {dormer.contactNo}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type & ID */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            dormer.type === 'student'
                              ? 'default'
                              : dormer.type === 'employee'
                              ? 'accent'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {dormer.type.toUpperCase()}
                        </Badge>
                        <p className="font-mono text-[11px] text-[#555552]">
                          {dormer.studentIdNo || dormer.employeeIdNo || dormer.externalId || '—'}
                        </p>
                      </div>
                    </td>

                    {/* Affiliation / Course */}
                    <td className="py-3 px-4">
                      {dormer.type === 'student' && (
                        <div>
                          <p className="font-medium text-[#141414]">{dormer.course || '—'}</p>
                          <p className="text-[11px] text-[#8C8C8A]">
                            {dormer.yearLevel} · {dormer.section}
                          </p>
                        </div>
                      )}
                      {dormer.type === 'employee' && (
                        <div>
                          <p className="font-medium text-[#141414]">{dormer.position || 'Staff'}</p>
                          <p className="text-[11px] text-[#8C8C8A]">{dormer.department || '—'}</p>
                        </div>
                      )}
                      {dormer.type === 'visitor' && (
                        <div>
                          <p className="font-medium text-[#141414]">{dormer.organization || 'Visitor'}</p>
                          <p className="text-[11px] text-[#8C8C8A] truncate max-w-45">
                            {dormer.purposeOfStay || 'Campus Visit'}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Room & Bed */}
                    <td className="py-3 px-4">
                      {isAssigned ? (
                        <div className="space-y-0.5">
                          <Badge variant="success" size="sm" dot>
                            Room {dormer.currentAssignment?.roomNumber}
                          </Badge>
                          <p className="text-[11px] text-[#555552] font-medium">
                            {dormer.currentAssignment?.slotLabel || 'Bed Slot'}
                          </p>
                          <p className="text-[10px] text-[#8C8C8A]">
                            Since {formatDate(dormer.currentAssignment?.checkInDate)}
                          </p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDormer(dormer);
                            setIsCheckInModalOpen(true);
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <DoorOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
                          Assign Bed
                        </Button>
                      )}
                    </td>

                    {/* Emergency Contact */}
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-[#141414]">{dormer.emergencyName}</p>
                      <p className="text-[11px] text-[#8C8C8A]">{dormer.emergencyContact}</p>
                      {dormer.emergencyRelationship && (
                        <span className="text-[10px] text-[#555552]">
                          ({dormer.emergencyRelationship})
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAssigned && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Transfer Bed"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDormerToTransfer(dormer);
                                setIsTransferModalOpen(true);
                              }}
                              className="p-1.5 h-8 text-[#4F46E5] hover:bg-[#EEF2FF]"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              title="Check out from room"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckout(dormer);
                              }}
                              className="p-1.5 h-8 text-[#D97706] hover:bg-[#FFFBEB]"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDormer(dormer);
                            setIsDormerModalOpen(true);
                          }}
                          className="p-1.5 h-8 text-[#555552] hover:text-[#141414]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Resident"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(dormer);
                          }}
                          className="p-1.5 h-8 text-[#DC2626] hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDormers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-[#8C8C8A]">
                    No dormers found matching the active filter or query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <DormerModal
        isOpen={isDormerModalOpen}
        onClose={() => setIsDormerModalOpen(false)}
        dormerToEdit={selectedDormer}
      />
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        dormer={selectedDormer}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setDormerToTransfer(null);
        }}
        dormer={dormerToTransfer}
      />
      <DormerProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerDormer(null);
        }}
        dormer={drawerDormer}
        onEdit={(d) => {
          setSelectedDormer(d);
          setIsDormerModalOpen(true);
        }}
        onCheckIn={(d) => {
          setSelectedDormer(d);
          setIsCheckInModalOpen(true);
        }}
        onTransfer={(d) => {
          setDormerToTransfer(d);
          setIsTransferModalOpen(true);
        }}
        onCheckout={(d) => handleCheckout(d)}
      />
      <ConfirmDialog
        isOpen={!!dormerToCheckout}
        title="Check Out Resident"
        message={dormerToCheckout ? `Are you sure you want to check out ${dormerToCheckout.firstName} ${dormerToCheckout.lastName} from Room ${dormerToCheckout.currentAssignment?.roomNumber}? The bed slot will become available for new occupants.` : ''}
        confirmText="Confirm Checkout"
        variant="primary"
        onConfirm={confirmCheckoutDormer}
        onClose={() => setDormerToCheckout(null)}
      />
      <ConfirmDialog
        isOpen={!!dormerToDelete}
        title="Delete Resident Record"
        message={dormerToDelete ? `Are you sure you want to permanently delete the profile of ${dormerToDelete.firstName} ${dormerToDelete.lastName}? This action cannot be undone.` : ''}
        confirmText="Delete Record"
        variant="danger"
        onConfirm={confirmDeleteDormer}
        onClose={() => setDormerToDelete(null)}
      />
    </AppShell>
  );
}
