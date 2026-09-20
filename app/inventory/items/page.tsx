'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { InventoryItem, InventoryCategory } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ItemModal } from '@/components/inventory/ItemModal';
import { QrCodeModal } from '@/components/inventory/QrCodeModal';
import { StockTransactionModal } from '@/components/inventory/StockTransactionModal';
import { exportToCsv } from '@/lib/csv';
import {
  Plus,
  QrCode,
  Search,
  Download,
  Edit2,
  Trash2,
  Boxes,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

function ItemsContent() {
  const searchParams = useSearchParams();
  const queryQrId = searchParams.get('qrId');

  const [items, setItems] = useState<InventoryItem[]>(store.getItems());
  const [categories, setCategories] = useState<InventoryCategory[]>(store.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalItemId, setStockModalItemId] = useState<string | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setItems(store.getItems());
      setCategories(store.getCategories());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (queryQrId) {
      const timer = setTimeout(() => {
        const item = store.getItemById(queryQrId);
        if (item) {
          setQrItem(item);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [queryQrId]);

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (stockStatusFilter === 'low' && (item.currentStock > item.minStock || item.currentStock === 0))
      return false;
    if (stockStatusFilter === 'out' && item.currentStock > 0) return false;
    if (stockStatusFilter === 'ok' && item.currentStock <= item.minStock) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      store.deleteInventoryItem(itemToDelete.id);
      toast.success('Catalog Item Removed', `${itemToDelete.name} (${itemToDelete.itemCode}) was removed.`);
      setItemToDelete(null);
    }
  };

  const handleExportCsv = () => {
    const rows = filteredItems.map((i) => ({
      Item_Code: i.itemCode,
      Item_Name: i.name,
      Category: i.categoryName,
      Description: i.description || '',
      Unit: i.unit,
      Current_Stock: i.currentStock,
      Minimum_Alert_Level: i.minStock,
      Storage_Location: i.location,
    }));
    exportToCsv('dims_inventory_items_catalog', rows);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Inventory & Physical Asset Catalog
            </h1>
            <Badge variant="default" size="sm">
              {items.length} Registered Items
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Track school dormitory equipment, bedding, lighting, safety apparatus, and appliances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Catalog CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex border-b border-[#E4E4E0] gap-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'py-2 px-1 text-xs font-semibold border-b-2 transition-all shrink-0',
              selectedCategory === 'all'
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
            )}
          >
            All Categories ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'py-2 px-1 text-xs font-semibold border-b-2 transition-all shrink-0',
                  isSelected
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
                )}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8C8A] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, asset code, or location..."
              className="input-minimal pl-10!"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="input-minimal w-auto"
            >
              <option value="all">All Stock Statuses</option>
              <option value="ok">Adequate Stock</option>
              <option value="low">Low Stock Warning</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="minimal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Asset Details
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Category & Location
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Current In Stock
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Min Alert Level
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Health Status
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {filteredItems.map((item) => {
                const isOutOfStock = item.currentStock === 0;
                const isLowStock = item.currentStock <= item.minStock && item.currentStock > 0;

                return (
                  <tr key={item.id} className="hover:bg-[#F8F8F6] transition-colors">
                    {/* Item Name & Code */}
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-[#141414] text-sm">{item.name}</p>
                        <p className="font-mono text-[11px] text-[#4F46E5] font-semibold mt-0.5">
                          {item.itemCode}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-[#8C8C8A] mt-1 max-w-sm truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#2C2C2A]">{item.categoryName}</p>
                      <p className="text-[11px] text-[#8C8C8A] mt-0.5">{item.location}</p>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-sm text-[#141414]">
                        {item.currentStock}
                      </span>{' '}
                      <span className="text-[#8C8C8A] text-xs">{item.unit}</span>
                    </td>

                    {/* Min Alert Level */}
                    <td className="py-3 px-4 font-mono text-xs text-[#555552]">
                      {item.minStock} {item.unit}
                    </td>

                    {/* Health Status */}
                    <td className="py-3 px-4">
                      {isOutOfStock ? (
                        <Badge variant="danger" size="sm" dot>
                          Out of Stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning" size="sm" dot>
                          Low Stock ({item.currentStock})
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm" dot>
                          In Stock
                        </Badge>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Generate QR Property Label"
                          onClick={() => setQrItem(item)}
                          className="p-1.5 h-8 text-[#4F46E5] hover:bg-[#EEF2FF]"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          title="Stock In / Out"
                          onClick={() => {
                            setStockModalItemId(item.id);
                            setIsStockModalOpen(true);
                          }}
                          className="p-1.5 h-8 text-[#16A34A] hover:bg-[#F0FDF4]"
                        >
                          <Boxes className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit Item"
                          onClick={() => {
                            setItemToEdit(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1.5 h-8 text-[#555552] hover:text-[#141414]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Item"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 h-8 text-[#DC2626] hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-[#8C8C8A]">
                    No inventory items found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
      />
      <QrCodeModal
        isOpen={!!qrItem}
        onClose={() => setQrItem(null)}
        item={qrItem}
      />
      <StockTransactionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        defaultItemId={stockModalItemId}
      />
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Remove Catalog Item"
        message={itemToDelete ? `Are you sure you want to permanently remove "${itemToDelete.name}" (${itemToDelete.itemCode}) from the inventory catalog?` : ''}
        confirmText="Remove Item"
        variant="danger"
        onConfirm={confirmDeleteItem}
        onClose={() => setItemToDelete(null)}
      />
    </AppShell>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#8C8C8A]">Loading catalog items...</div>}>
      <ItemsContent />
    </Suspense>
  );
}
