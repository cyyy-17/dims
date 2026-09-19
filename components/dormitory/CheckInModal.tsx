'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dormer } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  dormer?: Dormer | null;
  onSuccess?: () => void;
}

const CheckInFormContent: React.FC<{
  dormer: Dormer;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ dormer, onClose, onSuccess }) => {
  const rooms = store.getRooms();
  const [selectedRoomId, setSelectedRoomId] = useState(dormer.currentAssignment?.roomId || '');
  const [selectedBedSlotId, setSelectedBedSlotId] = useState(
    dormer.currentAssignment?.bedSlotId || ''
  );

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const availableSlots = selectedRoom
    ? selectedRoom.bedSlots.filter(
        (s) => !s.isOccupied || s.currentDormerId === dormer.id
      )
    : [];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !selectedBedSlotId) {
      toast.error('Selection Required', 'Please select both a room and an available bed slot.');
      return;
    }

    const success = store.assignDormerToBed(dormer.id, selectedRoomId, selectedBedSlotId);
    if (success) {
      toast.success('Check-In Completed', `${dormer.firstName} ${dormer.lastName} assigned to Room ${selectedRoom?.roomNumber}.`);
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleAssign} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Select Room</label>
        <select
          required
          value={selectedRoomId}
          onChange={(e) => {
            setSelectedRoomId(e.target.value);
            setSelectedBedSlotId('');
          }}
          className="input-minimal"
        >
          <option value="">-- Choose Target Room --</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id} disabled={r.status === 'maintenance'}>
              Room {r.roomNumber} ({r.type.toUpperCase()} · {r.occupants?.length || 0}/{r.capacity} Occupied){' '}
              {r.status === 'maintenance' ? '[MAINTENANCE]' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
          Select Bed Slot in Room {selectedRoom?.roomNumber || ''}
        </label>
        <select
          required
          disabled={!selectedRoomId}
          value={selectedBedSlotId}
          onChange={(e) => setSelectedBedSlotId(e.target.value)}
          className="input-minimal"
        >
          <option value="">-- Available Bed Slots --</option>
          {availableSlots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.slotLabel} {s.isOccupied ? '(Already held by dormer)' : '(Open Bed)'}
            </option>
          ))}
        </select>
      </div>

      {selectedRoom && (
        <div className="p-3 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-xs space-y-1">
          <p className="font-semibold text-[#141414]">Room {selectedRoom.roomNumber} Overview</p>
          <p className="text-[#555552]">
            Floor: {selectedRoom.floor} · Wing: {selectedRoom.wing} · Type: {selectedRoom.type}
          </p>
          <p className="text-[#8C8C8A]">{selectedRoom.notes || 'Standard student/staff accommodation.'}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Confirm Room Assignment
        </Button>
      </div>
    </form>
  );
};

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  dormer,
  onSuccess,
}) => {
  if (!dormer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Room: ${dormer.firstName} ${dormer.lastName}`}
      description={`Dormer Classification: ${dormer.type.toUpperCase()} · ${dormer.email}`}
      maxWidth="md"
    >
      {isOpen && (
        <CheckInFormContent
          key={dormer.id}
          dormer={dormer}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};
