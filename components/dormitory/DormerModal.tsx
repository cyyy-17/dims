'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dormer, DormerType } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { GraduationCap, Briefcase, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DormerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dormerToEdit?: Dormer | null;
}

const DormerFormContent: React.FC<{
  dormerToEdit?: Dormer | null;
  onClose: () => void;
}> = ({ dormerToEdit, onClose }) => {
  const [type, setType] = useState<DormerType>(dormerToEdit?.type || 'student');
  const [firstName, setFirstName] = useState(dormerToEdit?.firstName || '');
  const [lastName, setLastName] = useState(dormerToEdit?.lastName || '');
  const [email, setEmail] = useState(dormerToEdit?.email || '');
  const [contactNo, setContactNo] = useState(dormerToEdit?.contactNo || '');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say'>(
    dormerToEdit?.gender || 'prefer_not_to_say'
  );
  const [emergencyName, setEmergencyName] = useState(dormerToEdit?.emergencyName || '');
  const [emergencyContact, setEmergencyContact] = useState(dormerToEdit?.emergencyContact || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(
    dormerToEdit?.emergencyRelationship || ''
  );

  // Student specific
  const [studentIdNo, setStudentIdNo] = useState(dormerToEdit?.studentIdNo || '');
  const [yearLevel, setYearLevel] = useState(dormerToEdit?.yearLevel || '1st Year');
  const [section, setSection] = useState(dormerToEdit?.section || '');
  const [course, setCourse] = useState(dormerToEdit?.course || '');

  // Employee specific
  const [employeeIdNo, setEmployeeIdNo] = useState(dormerToEdit?.employeeIdNo || '');
  const [department, setDepartment] = useState(dormerToEdit?.department || '');
  const [position, setPosition] = useState(dormerToEdit?.position || '');

  // Visitor specific
  const [externalId, setExternalId] = useState(dormerToEdit?.externalId || '');
  const [organization, setOrganization] = useState(dormerToEdit?.organization || '');
  const [purposeOfStay, setPurposeOfStay] = useState(dormerToEdit?.purposeOfStay || '');
  const [expectedDeparture, setExpectedDeparture] = useState(dormerToEdit?.expectedDeparture || '');

  // Room Assignment
  const [selectedRoomId, setSelectedRoomId] = useState(
    dormerToEdit?.currentAssignment?.roomId || ''
  );
  const [selectedBedSlotId, setSelectedBedSlotId] = useState(
    dormerToEdit?.currentAssignment?.bedSlotId || ''
  );
  const availableRooms = store.getRooms();

  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const availableSlots = selectedRoom
    ? selectedRoom.bedSlots.filter(
        (s) => !s.isOccupied || (dormerToEdit && s.currentDormerId === dormerToEdit.id)
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Required Information', 'Please fill in all required fields (First Name, Last Name, and Email).');
      return;
    }

    if (dormerToEdit) {
      store.updateDormer(dormerToEdit.id, {
        type,
        firstName,
        lastName,
        email,
        contactNo,
        gender,
        emergencyName,
        emergencyContact,
        emergencyRelationship,
        studentIdNo: type === 'student' ? studentIdNo : undefined,
        yearLevel: type === 'student' ? yearLevel : undefined,
        section: type === 'student' ? section : undefined,
        course: type === 'student' ? course : undefined,
        employeeIdNo: type === 'employee' ? employeeIdNo : undefined,
        department: type === 'employee' ? department : undefined,
        position: type === 'employee' ? position : undefined,
        externalId: type === 'visitor' ? externalId : undefined,
        organization: type === 'visitor' ? organization : undefined,
        purposeOfStay: type === 'visitor' ? purposeOfStay : undefined,
        expectedDeparture: type === 'visitor' ? expectedDeparture : undefined,
      });

      if (selectedRoomId && selectedBedSlotId && selectedBedSlotId !== dormerToEdit.currentAssignment?.bedSlotId) {
        store.assignDormerToBed(dormerToEdit.id, selectedRoomId, selectedBedSlotId);
      }

      toast.success('Resident Profile Updated', `${firstName} ${lastName}'s records were saved.`);
    } else {
      const created = store.addDormer({
        type,
        firstName,
        lastName,
        email,
        contactNo,
        gender,
        emergencyName,
        emergencyContact,
        emergencyRelationship,
        studentIdNo: type === 'student' ? studentIdNo : undefined,
        yearLevel: type === 'student' ? yearLevel : undefined,
        section: type === 'student' ? section : undefined,
        course: type === 'student' ? course : undefined,
        employeeIdNo: type === 'employee' ? employeeIdNo : undefined,
        department: type === 'employee' ? department : undefined,
        position: type === 'employee' ? position : undefined,
        externalId: type === 'visitor' ? externalId : undefined,
        organization: type === 'visitor' ? organization : undefined,
        purposeOfStay: type === 'visitor' ? purposeOfStay : undefined,
        expectedDeparture: type === 'visitor' ? expectedDeparture : undefined,
        status: 'active',
      });

      if (created) {
        if (selectedRoomId && selectedBedSlotId) {
          store.assignDormerToBed(created.id, selectedRoomId, selectedBedSlotId);
        }
        toast.success('Resident Registered', `${firstName} ${lastName} (${type}) added to DIMS.`);
      }
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dormer Type Selector Pills */}
      <div>
        <label className="block text-xs font-semibold text-[#141414] mb-2 uppercase tracking-wider">
          Dormer Classification
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Enrolled pupils' },
            { id: 'employee', label: 'Employee', icon: Briefcase, desc: 'Faculty & staff' },
            { id: 'visitor', label: 'Visitor', icon: UserCheck, desc: 'Guests & researchers' },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as DormerType)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] shadow-xs'
                    : 'border-[#E4E4E0] bg-white text-[#2C2C2A] hover:bg-[#F8F8F6]'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{t.label}</span>
                </div>
                <span className="text-[11px] text-[#8C8C8A] mt-1">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#8C8C8A] uppercase tracking-wider">
          Personal Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              First Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Lucas"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Last Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Santos"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Official Email (For Brevo Notices) <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lucas.santos@school.edu.ph"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Contact Phone Number <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="+63 917 123 4567"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'prefer_not_to_say')}
              className="input-minimal"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to disclose</option>
            </select>
          </div>
        </div>
      </div>

      {/* Type Specific Fields */}
      <div className="space-y-4 p-4 rounded-xl bg-[#F8F8F6] border border-[#E4E4E0]">
        <h4 className="text-xs font-semibold text-[#141414] uppercase tracking-wider flex items-center gap-1.5">
          {type === 'student' && <GraduationCap className="w-4 h-4 text-[#4F46E5]" />}
          {type === 'employee' && <Briefcase className="w-4 h-4 text-[#4F46E5]" />}
          {type === 'visitor' && <UserCheck className="w-4 h-4 text-[#4F46E5]" />}
          {type.toUpperCase()} Specific Details
        </h4>

        {type === 'student' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Student ID No</label>
              <input
                type="text"
                value={studentIdNo}
                onChange={(e) => setStudentIdNo(e.target.value)}
                placeholder="e.g. STU-2026-001"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Course / Degree</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BS Information Technology"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="input-minimal"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate">Graduate / Postgrad</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Section</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. BSIT-3A"
                className="input-minimal"
              />
            </div>
          </div>
        )}

        {type === 'employee' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Employee ID No</label>
              <input
                type="text"
                value={employeeIdNo}
                onChange={(e) => setEmployeeIdNo(e.target.value)}
                placeholder="e.g. EMP-2026-088"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Department / College</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. College of Science"
                className="input-minimal"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Job Title / Designation</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Associate Professor / Laboratory Custodian"
                className="input-minimal"
              />
            </div>
          </div>
        )}

        {type === 'visitor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">External ID / Passport No</label>
              <input
                type="text"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="e.g. PASS-KOR-88219"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Affiliated Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. UNESCO / Visiting University"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Purpose of Stay</label>
              <input
                type="text"
                value={purposeOfStay}
                onChange={(e) => setPurposeOfStay(e.target.value)}
                placeholder="e.g. Academic Research / Accreditation"
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Expected Departure Date</label>
              <input
                type="date"
                value={expectedDeparture}
                onChange={(e) => setExpectedDeparture(e.target.value)}
                className="input-minimal"
              />
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#8C8C8A] uppercase tracking-wider">
          Emergency Contact Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Contact Name *</label>
            <input
              type="text"
              required
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. Maria Santos"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Emergency Phone *</label>
            <input
              type="text"
              required
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. +63 918 123 4567"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Relationship</label>
            <input
              type="text"
              value={emergencyRelationship}
              onChange={(e) => setEmergencyRelationship(e.target.value)}
              placeholder="e.g. Mother, Spouse, Guardian"
              className="input-minimal"
            />
          </div>
        </div>
      </div>

      {/* Room Allocation */}
      <div className="p-4 rounded-xl border border-[#E4E4E0] bg-white space-y-3">
        <h4 className="text-xs font-semibold text-[#141414] uppercase tracking-wider flex items-center justify-between">
          <span>Dormitory Room & Bed Allocation</span>
          <span className="text-[10px] text-[#8C8C8A] font-normal lowercase">optional</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Select Room</label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                setSelectedBedSlotId('');
              }}
              className="input-minimal"
            >
              <option value="">-- No Room Assigned Yet --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type.toUpperCase()}, {r.occupants?.length || 0}/{r.capacity} Occupied)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Select Bed Slot</label>
            <select
              disabled={!selectedRoomId}
              value={selectedBedSlotId}
              onChange={(e) => setSelectedBedSlotId(e.target.value)}
              className="input-minimal"
            >
              <option value="">-- Select Available Bed Slot --</option>
              {availableSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.slotLabel} {s.isOccupied ? '(Currently Assigned to this dormer)' : '(Available)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {dormerToEdit ? 'Save Changes' : 'Register Dormer'}
        </Button>
      </div>
    </form>
  );
};

export const DormerModal: React.FC<DormerModalProps> = ({ isOpen, onClose, dormerToEdit }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dormerToEdit ? 'Edit Dormer Profile' : 'Register New Dormer'}
      description="Record resident details for student, employee, or authorized visitor."
      maxWidth="xl"
    >
      {isOpen && (
        <DormerFormContent
          key={dormerToEdit ? dormerToEdit.id : 'new'}
          dormerToEdit={dormerToEdit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};
