'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { RoomInventoryItem, ItemCondition } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exportToCsv } from '@/lib/csv';
import {
  RotateCcw,
  Download,
  Filter,
  Search,
  DoorOpen,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RoomItemsPage() {
  const [roomItems, setRoomItems] = useState<RoomInventoryItem[]>(store.getRoomInventory());
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Return item modal
  const [returnItem, setReturnItem] = useState<RoomInventoryItem | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnCondition, setReturnCondition] = useState<ItemCondition>('good');

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRoomItems(store.getRoomInventory());
    });
    return unsub;
  }, []);

  const rooms = store.getRooms();

  const filtered = roomItems.filter((ri) => {
    if (ri.returnedAt) return false; // only active in-room assignments
    if (roomFilter !== 'all' && ri.roomId !== roomFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ri.itemName.toLowerCase().includes(q) ||
        ri.itemCode.toLowerCase().includes(q) ||
        ri.roomNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItem) return;

    store.returnItemFromRoom(returnItem.id, returnQty, returnCondition);
    setReturnItem(null);
  };

  const handleExportCsv = () => {
    const rows = filtered.map((ri) => ({
      Room_Number: ri.roomNumber,
      Item_Code: ri.itemCode,
      Item_Name: ri.itemName,
      Quantity: ri.quantity,
      Condition: ri.condition,
      Assigned_Date: ri.assignedAt,
      Assigned_By: ri.assignedBy,
    }));
    exportToCsv('dims_room_assigned_inventory', rows);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Room Assigned Physical Assets
            </h1>
            <Badge variant="default" size="sm">
              {filtered.reduce((sum, i) => sum + i.quantity, 0)} Total Assets Deployed
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Track equipment assigned inside dormitory rooms and process returns with condition inspection
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export Room Assets CSV
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8C8A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by asset name, code, or room number..."
            className="input-minimal pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C8C8A]" />
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="input-minimal w-auto"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} ({r.floor})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assigned Assets Table */}
      <div className="minimal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Assigned Room
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Asset Details
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Quantity Deployed
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Physical Condition
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Assigned Since
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F8F6] transition-colors">
                  {/* Room Number */}
                  <td className="py-3 px-4">
                    <Badge variant="default" size="sm" className="font-bold">
                      <DoorOpen className="w-3.5 h-3.5 mr-1" />
                      Room {item.roomNumber}
                    </Badge>
                  </td>

                  {/* Asset */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#141414] text-sm">{item.itemName}</p>
                    <p className="font-mono text-[11px] text-[#4F46E5] font-semibold mt-0.5">
                      {item.itemCode}
                    </p>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4 font-mono font-bold text-sm text-[#141414]">
                    {item.quantity} units
                  </td>

                  {/* Condition */}
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        item.condition === 'new'
                          ? 'success'
                          : item.condition === 'good'
                          ? 'default'
                          : item.condition === 'fair'
                          ? 'neutral'
                          : 'warning'
                      }
                      size="sm"
                      className="uppercase font-mono text-[10px]"
                    >
                      {item.condition.replace('_', ' ')}
                    </Badge>
                  </td>

                  {/* Assigned Since & By */}
                  <td className="py-3 px-4 text-xs text-[#555552]">
                    <p>{formatDate(item.assignedAt)}</p>
                    <p className="text-[10px] text-[#8C8C8A]">By {item.assignedBy}</p>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setReturnItem(item);
                        setReturnQty(item.quantity);
                        setReturnCondition(item.condition);
                      }}
                      className="text-xs h-7 gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
                      Return to Stock
                    </Button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-[#8C8C8A]">
                    No deployed room assets match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return to stock modal */}
      {returnItem && (
        <Modal
          isOpen={!!returnItem}
          onClose={() => setReturnItem(null)}
          title={`Return Asset: ${returnItem.itemName}`}
          description={`From Room ${returnItem.roomNumber} back to Central Inventory`}
          maxWidth="md"
        >
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                Quantity to Return (Max: {returnItem.quantity})
              </label>
              <input
                type="number"
                min="1"
                max={returnItem.quantity}
                required
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="input-minimal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                Inspected Condition Upon Return
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as ItemCondition)}
                className="input-minimal"
              >
                <option value="good">Good (Re-assignable)</option>
                <option value="fair">Fair (Usable with minor wear)</option>
                <option value="for_repair">For Repair (Sent to maintenance)</option>
                <option value="condemned">Condemned (Damaged/Disposal)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
              <Button type="button" variant="secondary" onClick={() => setReturnItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Return to Custody
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
