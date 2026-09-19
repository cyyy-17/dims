'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Room, RoomStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RoomModal } from '@/components/dormitory/RoomModal';
import {
  Plus,
  Filter,
  User,
  Package,
  Edit2,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(store.getRooms());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRooms(store.getRooms());
    });
    return unsub;
  }, []);

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterFloor !== 'all' && r.floor !== filterFloor) return false;
    return true;
  });

  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
  };

  const confirmDeleteRoom = () => {
    if (roomToDelete) {
      const success = store.deleteRoom(roomToDelete.id);
      if (success) {
        toast.success('Room Deleted', `Room ${roomToDelete.roomNumber} was removed from the system.`);
      }
      setRoomToDelete(null);
    }
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return <Badge variant="success" size="sm" dot>Available</Badge>;
      case 'partial':
        return <Badge variant="warning" size="sm" dot>Partially Occupied</Badge>;
      case 'full':
        return <Badge variant="default" size="sm" dot>Fully Occupied</Badge>;
      case 'maintenance':
        return <Badge variant="danger" size="sm" dot>Maintenance</Badge>;
    }
  };

  const roomInventory = store.getRoomInventory();

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Dormitory Rooms & Bed Allocations
            </h1>
            <Badge variant="neutral" size="sm">
              {rooms.length} Total Rooms
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Single area campus rooms with real-time bed slot occupancy tracking
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setRoomToEdit(null);
            setIsRoomModalOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Room
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C8C8A]" />
          <span className="text-xs font-semibold text-[#141414]">Filter By:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-minimal w-auto"
          >
            <option value="all">All Room Statuses</option>
            <option value="available">Available Only</option>
            <option value="partial">Partial Occupancy</option>
            <option value="full">Full Occupancy</option>
            <option value="maintenance">Under Maintenance</option>
          </select>

          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="input-minimal w-auto"
          >
            <option value="all">All Floors</option>
            <option value="1st Floor">1st Floor</option>
            <option value="2nd Floor">2nd Floor</option>
          </select>
        </div>

        <div className="text-xs text-[#8C8C8A]">
          Showing <strong className="text-[#141414]">{filteredRooms.length}</strong> rooms
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const occupants = room.occupants || [];
          const assignedAssets = roomInventory.filter(
            (ri) => ri.roomId === room.id && !ri.returnedAt
          );

          return (
            <div
              key={room.id}
              className="minimal-card p-5 space-y-4 flex flex-col justify-between minimal-card-hover"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#141414]">
                        Room {room.roomNumber}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#F4F4F2] text-[#555552]">
                        {room.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8C8A] mt-0.5">
                      {room.floor} · {room.wing}
                    </p>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                {/* Capacity & Occupancy Bar */}
                <div className="mt-3 pt-3 border-t border-[#ECECE8] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C8C8A]">Bed Capacity</span>
                    <span className="font-semibold text-[#141414]">
                      {occupants.length} / {room.capacity} Beds Occupied
                    </span>
                  </div>
                  <div className="w-full bg-[#ECECE8] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4F46E5] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((occupants.length / room.capacity) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bed Slots Listing */}
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C8A]">
                    Bed Allocation
                  </p>
                  <div className="space-y-1.5">
                    {room.bedSlots.map((slot) => {
                      const occupant = occupants.find(
                        (o) => o.slotLabel === slot.slotLabel || o.dormerId === slot.currentDormerId
                      );

                      return (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-xs"
                        >
                          <span className="font-medium text-[#2C2C2A]">{slot.slotLabel}</span>
                          {occupant ? (
                            <span className="font-semibold text-[#4F46E5] flex items-center gap-1 truncate max-w-35">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{occupant.fullName}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#16A34A] font-medium">
                              Empty / Available
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Room Assets Preview */}
                {assignedAssets.length > 0 && (
                  <div className="mt-3 pt-2 text-[11px] text-[#8C8C8A] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>
                      {assignedAssets.reduce((sum, a) => sum + a.quantity, 0)} assigned assets (
                      {assignedAssets.map((a) => a.itemName).slice(0, 2).join(', ')}
                      {assignedAssets.length > 2 ? '...' : ''})
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-[#E4E4E0] flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-[#141414]">
                  {formatCurrency(room.monthlyRate)}/mo
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRoomToEdit(room);
                      setIsRoomModalOpen(true);
                    }}
                    className="p-1.5 h-8 text-[#555552] hover:text-[#141414]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRoom(room)}
                    className="p-1.5 h-8 text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomToEdit={roomToEdit}
      />
      <ConfirmDialog
        isOpen={!!roomToDelete}
        title="Delete Dormitory Room"
        message={roomToDelete ? `Are you sure you want to delete Room ${roomToDelete.roomNumber}? This action cannot be undone.` : ''}
        confirmText="Delete Room"
        variant="danger"
        onConfirm={confirmDeleteRoom}
        onClose={() => setRoomToDelete(null)}
      />
    </AppShell>
  );
}
