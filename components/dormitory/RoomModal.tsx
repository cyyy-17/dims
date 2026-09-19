'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Room, RoomType, RoomStatus } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room | null;
}

const RoomFormContent: React.FC<{
  roomToEdit?: Room | null;
  onClose: () => void;
}> = ({ roomToEdit, onClose }) => {
  const [roomNumber, setRoomNumber] = useState(roomToEdit?.roomNumber || '');
  const [floor, setFloor] = useState(roomToEdit?.floor || '1st Floor');
  const [wing, setWing] = useState(roomToEdit?.wing || 'East Wing');
  const [type, setType] = useState<RoomType>(roomToEdit?.type || 'double');
  const [capacity, setCapacity] = useState(roomToEdit?.capacity || 2);
  const [status, setStatus] = useState<RoomStatus>(roomToEdit?.status || 'available');
  const [monthlyRate, setMonthlyRate] = useState(roomToEdit?.monthlyRate || 3500);
  const [notes, setNotes] = useState(roomToEdit?.notes || '');

  const handleTypeChange = (newType: RoomType) => {
    setType(newType);
    if (newType === 'single') setCapacity(1);
    else if (newType === 'double') setCapacity(2);
    else if (newType === 'quad') setCapacity(4);
    else if (newType === 'suite') setCapacity(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      toast.error('Required Information', 'Room Number is required.');
      return;
    }

    // Capacity validation per room type
    if (type === 'single' && Number(capacity) !== 1) {
      toast.warning('Invalid Capacity', 'Single occupancy rooms must have a capacity of 1.');
      return;
    }
    if (type === 'double' && Number(capacity) !== 2) {
      toast.warning('Invalid Capacity', 'Double occupancy rooms must have a capacity of 2.');
      return;
    }
    if (type === 'quad' && Number(capacity) !== 4) {
      toast.warning('Invalid Capacity', 'Quad occupancy rooms must have a capacity of 4.');
      return;
    }

    if (roomToEdit) {
      store.updateRoom(roomToEdit.id, {
        roomNumber,
        floor,
        wing,
        type,
        capacity: Number(capacity),
        status,
        monthlyRate: Number(monthlyRate),
        notes,
      });
      toast.success('Room Updated', `Room ${roomNumber} parameters saved.`);
    } else {
      store.addRoom({
        roomNumber,
        floor,
        wing,
        type,
        capacity: Number(capacity),
        status,
        monthlyRate: Number(monthlyRate),
        notes,
      });
      toast.success('Room Created', `Room ${roomNumber} (${type}) was added.`);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Room Number <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 106 or 206"
            className="input-minimal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Room Type</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as RoomType)}
            className="input-minimal"
          >
            <option value="single">Single (1 Bed)</option>
            <option value="double">Double (2 Beds)</option>
            <option value="quad">Quad (4 Beds)</option>
            <option value="suite">Executive Suite (2 Beds)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Floor</label>
          <input
            type="text"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="e.g. 1st Floor"
            className="input-minimal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Wing / Corridor</label>
          <input
            type="text"
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            placeholder="e.g. East Wing"
            className="input-minimal"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Capacity (Beds)</label>
          <input
            type="number"
            min="1"
            max="8"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="input-minimal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RoomStatus)}
            className="input-minimal"
          >
            <option value="available">Available</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
          Monthly Rate / Fee (PHP)
        </label>
        <input
          type="number"
          value={monthlyRate}
          onChange={(e) => setMonthlyRate(Number(e.target.value))}
          className="input-minimal"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Room Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special features, furniture, window view, etc."
          className="input-minimal"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {roomToEdit ? 'Save Changes' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
};

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, roomToEdit }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={roomToEdit ? `Edit Room ${roomToEdit.roomNumber}` : 'Create New Dormitory Room'}
      description="Define room specifications, floor location, capacity, and rate."
      maxWidth="md"
    >
      {isOpen && (
        <RoomFormContent
          key={roomToEdit ? roomToEdit.id : 'new'}
          roomToEdit={roomToEdit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};
