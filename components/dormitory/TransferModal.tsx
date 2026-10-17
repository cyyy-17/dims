'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Dormer } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  dormer?: Dormer | null;
  onSuccess?: () => void;
}

const TransferFormContent: React.FC<{
  dormer: Dormer;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ dormer, onClose, onSuccess }) => {
  const rooms = store.getRooms();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedSlotId, setSelectedBedSlotId] = useState('');

  const currentRoom = dormer.currentAssignment
    ? rooms.find((r) => r.id === dormer.currentAssignment?.roomId)
    : null;

  const targetRoom = rooms.find((r) => r.id === selectedRoomId);
  const availableSlots = targetRoom
    ? targetRoom.bedSlots.filter((s) => !s.isOccupied)
    : [];

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !selectedBedSlotId) {
      toast.error('Selection Required', 'Please select both a target room and an available bed slot.');
      return;
    }

    const success = store.transferDormer(dormer.id, selectedRoomId, selectedBedSlotId);
    if (success) {
      toast.success(
        'Bed Transfer Successful',
        `${dormer.firstName} ${dormer.lastName} was transferred to Room ${targetRoom?.roomNumber}.`
      );
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleTransfer} className="space-y-4">
      {/* Current Assignment Snapshot */}
      <div className="p-3 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-xs space-y-1">
        <p className="text-[10px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
          Current Assignment
        </p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#141414]">
            Room {dormer.currentAssignment?.roomNumber || 'Unassigned'}
          </span>
          <span className="text-[#555552] font-medium">
            {dormer.currentAssignment?.slotLabel || 'No Slot'}
          </span>
        </div>
        {currentRoom && (
          <p className="text-[#8C8C8A]">
            {currentRoom.type.toUpperCase()} Room · {currentRoom.capacity} Beds
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Select New Target Room</label>
        <select
          required
          value={selectedRoomId}
          onChange={(e) => {
            setSelectedRoomId(e.target.value);
            setSelectedBedSlotId('');
          }}
          className="input-minimal"
        >
          <option value="">-- Choose New Target Room --</option>
          {rooms
            .filter((r) => r.id !== dormer.currentAssignment?.roomId)
            .map((r) => (
              <option key={r.id} value={r.id} disabled={r.status === 'full' || r.status === 'maintenance'}>
                Room {r.roomNumber} ({r.type.toUpperCase()} · {r.occupants?.length || 0}/{r.capacity} Occupied){' '}
                {r.status === 'maintenance' ? '[MAINTENANCE]' : r.status === 'full' ? '[FULL]' : ''}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
          Select Bed Slot in Room {targetRoom?.roomNumber || ''}
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
              {s.slotLabel} (Open Bed)
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E0]">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Confirm Bed Transfer</span>
        </Button>
      </div>
    </form>
  );
};

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  dormer,
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Bed: ${dormer ? `${dormer.firstName} ${dormer.lastName}` : ''}`}
      maxWidth="md"
    >
      {dormer ? (
        <TransferFormContent dormer={dormer} onClose={onClose} onSuccess={onSuccess} />
      ) : (
        <div className="p-4 text-center text-xs text-[#8C8C8A]">No dormer selected.</div>
      )}
    </Modal>
  );
};
