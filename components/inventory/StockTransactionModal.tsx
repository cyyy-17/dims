'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StockTransactionType, ItemCondition } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultItemId?: string;
  defaultType?: StockTransactionType;
  onSuccess?: () => void;
}

const StockFormContent: React.FC<{
  defaultItemId?: string;
  defaultType?: StockTransactionType;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ defaultItemId, defaultType = 'in', onClose, onSuccess }) => {
  const items = store.getItems();
  const rooms = store.getRooms();
  const dormers = store.getDormers().filter((d) => d.status === 'active');

  const [type, setType] = useState<StockTransactionType>(defaultType);
  const [itemId, setItemId] = useState(defaultItemId || items[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [referenceNo, setReferenceNo] = useState(() => `REF-${Date.now().toString().slice(-6)}`);
  const [supplier, setSupplier] = useState('');
  const [purpose, setPurpose] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dormerId, setDormerId] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [notes, setNotes] = useState('');

  const selectedItem = items.find((i) => i.id === itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || quantity <= 0) {
      toast.error('Invalid Transaction', 'Please choose an item and specify a valid quantity (> 0).');
      return;
    }

    const success = store.recordStockTransaction({
      itemId,
      type,
      quantity: Number(quantity),
      referenceNo,
      supplier: type === 'in' ? supplier : undefined,
      issuedTo:
        type === 'out' && dormerId
          ? (() => {
              const d = dormers.find((dm) => dm.id === dormerId);
              return d ? `${d.firstName} ${d.lastName}` : undefined;
            })()
          : undefined,
      dormerId: type === 'out' ? dormerId : undefined,
      roomId: type === 'out' ? roomId : undefined,
      condition: type === 'return' ? condition : undefined,
      notes,
    });

    if (success) {
      toast.success('Stock Transaction Recorded', `${type.toUpperCase()} ${quantity}x ${selectedItem?.name}`);
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type Selector */}
      <div>
        <label className="block text-xs font-semibold text-[#141414] mb-2 uppercase tracking-wider">
          Movement Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'in', label: 'Stock In', icon: ArrowDownLeft, desc: 'Receive new supply' },
            { id: 'out', label: 'Stock Out', icon: ArrowUpRight, desc: 'Issue to room/resident' },
            { id: 'return', label: 'Return', icon: RotateCcw, desc: 'Return back to stock' },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as StockTransactionType)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] shadow-xs'
                    : 'border-[#E4E4E0] bg-white text-[#2C2C2A] hover:bg-[#F8F8F6]'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{t.label}</span>
                </div>
                <span className="text-[10px] text-[#8C8C8A] mt-1">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Selection & Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Select Inventory Item <span className="text-[#DC2626]">*</span>
          </label>
          <select
            required
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="input-minimal"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.itemCode}) — In Stock: {i.currentStock} {i.unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Quantity ({selectedItem?.unit || 'units'}) <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input-minimal"
          />
        </div>
      </div>

      {/* Current Stock Snapshot Alert */}
      {selectedItem && (
        <div className="p-3 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] flex items-center justify-between text-xs">
          <span className="text-[#555552]">
            Current Balance: <strong className="text-[#141414]">{selectedItem.currentStock} {selectedItem.unit}</strong>
          </span>
          <span className="text-[#8C8C8A] font-mono text-[11px]">
            Min Alert Level: {selectedItem.minStock}
          </span>
        </div>
      )}

      {/* Dynamic Fields */}
      {type === 'in' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Supplier / Vendor</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Apex Foam & Bedding Corp"
              className="input-minimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">PO / Receipt No</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="PO-2026-..."
              className="input-minimal"
            />
          </div>
        </div>
      )}

      {type === 'out' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Assign Directly to Room (Optional)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="input-minimal"
            >
              <option value="">-- General Issuance / Not Room Specific --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Issued to Resident (Optional)
            </label>
            <select
              value={dormerId}
              onChange={(e) => setDormerId(e.target.value)}
              className="input-minimal"
            >
              <option value="">-- None (Facility Custody) --</option>
              {dormers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {(type === 'out' || type === 'return') && (
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Asset Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
            className="input-minimal"
          >
            <option value="new">Brand New</option>
            <option value="good">Good (Fully Serviceable)</option>
            <option value="fair">Fair (Minor cosmetic wear)</option>
            <option value="for_repair">For Repair</option>
            <option value="condemned">Condemned / For Disposal</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Purpose / Notes</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            setNotes(e.target.value);
          }}
          placeholder="e.g. Initial dorm setup, replacement for broken unit..."
          className="input-minimal"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Record Transaction
        </Button>
      </div>
    </form>
  );
};

export const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultItemId,
  defaultType = 'in',
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Movement"
      description="Perform Stock In (receiving), Stock Out (issuance to room/dormer), or Return to custody."
      maxWidth="lg"
    >
      {isOpen && (
        <StockFormContent
          key={`${defaultItemId || 'item'}-${defaultType}-${isOpen}`}
          defaultItemId={defaultItemId}
          defaultType={defaultType}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};
