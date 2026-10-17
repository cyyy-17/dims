'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { InventoryItem } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
}

const ItemFormContent: React.FC<{
  itemToEdit?: InventoryItem | null;
  onClose: () => void;
}> = ({ itemToEdit, onClose }) => {
  const categories = store.getCategories();
  const [categoryId, setCategoryId] = useState(itemToEdit?.categoryId || categories[0]?.id || 'cat-1');
  const [itemCode, setItemCode] = useState(itemToEdit?.itemCode || '');
  const [name, setName] = useState(itemToEdit?.name || '');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [unit, setUnit] = useState(itemToEdit?.unit || 'pcs');
  const [minStock, setMinStock] = useState(itemToEdit?.minStock ?? 5);
  const [currentStock, setCurrentStock] = useState(itemToEdit?.currentStock ?? 10);
  const [location, setLocation] = useState(itemToEdit?.location || 'Central Storage');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !name.trim()) {
      toast.error('Required Information', 'Item Code and Item Name are required.');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat?.name || 'General';

    if (itemToEdit) {
      store.updateInventoryItem(itemToEdit.id, {
        itemCode,
        name,
        categoryId,
        categoryName,
        description,
        unit,
        minStock: Number(minStock),
        currentStock: Number(currentStock),
        location,
      });
      toast.success('Catalog Item Updated', `${name} details have been saved.`);
    } else {
      await store.addInventoryItem({
        itemCode,
        name,
        categoryId,
        categoryName,
        description,
        unit,
        minStock: Number(minStock),
        currentStock: Number(currentStock),
        location,
        isActive: true,
      });
      toast.success('Catalog Item Created', `${name} (${itemCode}) added to inventory.`);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Asset / Item Code <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            placeholder="e.g. FURN-MAT-01"
            className="input-minimal font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-minimal"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
          Item Name <span className="text-[#DC2626]">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Single Orthopedic Foam Mattress"
          className="input-minimal"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brand, size, warranty specifications, material details..."
          className="input-minimal"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Unit of Measure</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pcs, units, sets"
            className="input-minimal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Minimum Alert Level
          </label>
          <input
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            className="input-minimal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            {itemToEdit ? 'Current In Stock' : 'Initial Stock Quantity'}
          </label>
          <input
            type="number"
            min="0"
            value={currentStock}
            onChange={(e) => setCurrentStock(Number(e.target.value))}
            className="input-minimal"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Storage Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Central Warehouse Bay A / Electrical Cabinet"
          className="input-minimal"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {itemToEdit ? 'Save Changes' : 'Add Item to Catalog'}
        </Button>
      </div>
    </form>
  );
};

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? `Edit Catalog Item: ${itemToEdit.name}` : 'Add Inventory Asset'}
      description="Register equipment, bedding, tools, or appliances into school custody."
      maxWidth="md"
    >
      {isOpen && (
        <ItemFormContent
          key={itemToEdit ? itemToEdit.id : 'new'}
          itemToEdit={itemToEdit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};
