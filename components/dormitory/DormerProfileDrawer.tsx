'use client';

import React, { useEffect } from 'react';
import { Dormer } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  X,
  GraduationCap,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  ShieldAlert,
  DoorOpen,
  ArrowRightLeft,
  LogOut,
  Edit2,
  Calendar,
} from 'lucide-react';

interface DormerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dormer: Dormer | null;
  onEdit?: (dormer: Dormer) => void;
  onCheckIn?: (dormer: Dormer) => void;
  onTransfer?: (dormer: Dormer) => void;
  onCheckout?: (dormer: Dormer) => void;
}

export const DormerProfileDrawer: React.FC<DormerProfileDrawerProps> = ({
  isOpen,
  onClose,
  dormer,
  onEdit,
  onCheckIn,
  onTransfer,
  onCheckout,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !dormer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-[#E4E4E0] flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E4E4E0] flex items-start justify-between bg-[#F8F8F6]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center font-bold text-[#4F46E5] text-base">
              {dormer.firstName[0]}
              {dormer.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#141414] text-base">
                  {dormer.firstName} {dormer.lastName}
                </h3>
                <Badge
                  variant={dormer.status === 'active' ? 'success' : 'neutral'}
                  size="sm"
                >
                  {dormer.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="neutral" size="sm">
                  {dormer.type === 'student' && <GraduationCap className="w-3 h-3 mr-1 inline" />}
                  {dormer.type === 'employee' && <Briefcase className="w-3 h-3 mr-1 inline" />}
                  {dormer.type === 'visitor' && <UserCheck className="w-3 h-3 mr-1 inline" />}
                  {dormer.type.toUpperCase()}
                </Badge>
                {dormer.gender && dormer.gender !== 'prefer_not_to_say' && (
                  <span className="text-[11px] text-[#8C8C8A] capitalize">
                    · {dormer.gender}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Profile Drawer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C8C8A] hover:text-[#141414] hover:bg-[#E4E4E0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Room Allocation Card */}
          <div className="p-4 rounded-xl border border-[#E4E4E0] bg-[#FAFAFA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                Current Bed Allocation
              </span>
              {dormer.currentAssignment?.roomNumber ? (
                <Badge variant="default" size="sm">
                  Room {dormer.currentAssignment.roomNumber}
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Unallocated
                </Badge>
              )}
            </div>

            {dormer.currentAssignment ? (
              <div className="space-y-1 pt-1">
                <p className="text-sm font-semibold text-[#141414]">
                  {dormer.currentAssignment.slotLabel || 'Assigned Bed'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#555552]">
                  <Calendar className="w-3.5 h-3.5 text-[#8C8C8A]" />
                  <span>Check-in date: {formatDate(dormer.currentAssignment.checkInDate)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8C8C8A] pt-1">
                This resident currently has no active room assignment.
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8A]">
              Contact Information
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                <Mail className="w-4 h-4 text-[#4F46E5] shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-[#8C8C8A]">Institutional Email</p>
                  <p className="font-medium text-[#141414] truncate">{dormer.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                <Phone className="w-4 h-4 text-[#16A34A] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#8C8C8A]">Mobile Number</p>
                  <p className="font-medium text-[#141414]">
                    {dormer.contactNo || 'No phone recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic / Employment Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8A]">
              Institutional Affiliation
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {dormer.type === 'student' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Student ID No.</p>
                    <p className="font-mono font-semibold text-[#141414]">
                      {dormer.studentIdNo || '—'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Year & Section</p>
                    <p className="font-medium text-[#141414]">
                      {dormer.yearLevel || '—'} {dormer.section ? `(${dormer.section})` : ''}
                    </p>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Degree Program / Course</p>
                    <p className="font-medium text-[#141414]">{dormer.course || '—'}</p>
                  </div>
                </>
              )}

              {dormer.type === 'employee' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Employee ID No.</p>
                    <p className="font-mono font-semibold text-[#141414]">
                      {dormer.employeeIdNo || '—'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Department</p>
                    <p className="font-medium text-[#141414]">{dormer.department || '—'}</p>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Position / Title</p>
                    <p className="font-medium text-[#141414]">{dormer.position || '—'}</p>
                  </div>
                </>
              )}

              {dormer.type === 'visitor' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Organization</p>
                    <p className="font-medium text-[#141414]">{dormer.organization || '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Expected Departure</p>
                    <p className="font-medium text-[#141414]">
                      {dormer.expectedDeparture ? formatDate(dormer.expectedDeparture) : '—'}
                    </p>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0]">
                    <p className="text-[10px] text-[#8C8C8A]">Purpose of Stay</p>
                    <p className="font-medium text-[#141414]">{dormer.purposeOfStay || '—'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8A] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Emergency Contact</span>
            </h4>
            <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-1 text-[#92400E]">
              <p className="font-semibold text-[#141414]">
                {dormer.emergencyName || 'No emergency contact specified'}
              </p>
              <p className="text-[#555552]">
                Contact: <span className="font-mono font-medium">{dormer.emergencyContact || '—'}</span>
                {dormer.emergencyRelationship ? ` (${dormer.emergencyRelationship})` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E4E4E0] bg-[#F8F8F6] flex flex-wrap items-center justify-between gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(dormer);
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            {dormer.currentAssignment?.roomId ? (
              <>
                {onTransfer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onTransfer(dormer);
                    }}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Bed</span>
                  </Button>
                )}
                {onCheckout && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onCheckout(dormer);
                    }}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </Button>
                )}
              </>
            ) : (
              onCheckIn && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCheckIn(dormer);
                  }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Assign Bed</span>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
