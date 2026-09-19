'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { StockTransaction } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StockTransactionModal } from '@/components/inventory/StockTransactionModal';
import { exportToCsv } from '@/lib/csv';
import {
  Plus,
  Download,
  Filter,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function StockPage() {
  const [transactions, setTransactions] = useState<StockTransaction[]>(store.getTransactions());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTransactions(store.getTransactions());
    });
    return unsub;
  }, []);

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.itemName.toLowerCase().includes(q) ||
        tx.itemCode.toLowerCase().includes(q) ||
        (tx.referenceNo && tx.referenceNo.toLowerCase().includes(q)) ||
        (tx.supplier && tx.supplier.toLowerCase().includes(q)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(q)) ||
        (tx.roomNumber && tx.roomNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const rows = filtered.map((tx) => ({
      Timestamp: formatDateTime(tx.createdAt),
      Type: tx.type.toUpperCase(),
      Item_Code: tx.itemCode,
      Item_Name: tx.itemName,
      Quantity: tx.quantity,
      Reference_No: tx.referenceNo || 'N/A',
      Supplier: tx.supplier || 'N/A',
      Issued_To_Room: tx.roomNumber || 'N/A',
      Issued_To_Dormer: tx.dormerName || 'N/A',
      Condition: tx.condition || 'N/A',
      Purpose: tx.purpose || '',
      Performed_By: tx.performedBy,
    }));
    exportToCsv('dims_stock_movement_ledger', rows);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Stock Movements & Ledger History
            </h1>
            <Badge variant="default" size="sm">
              {transactions.length} Transactions Recorded
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Auditable custody trail of every asset received, issued to rooms/residents, or returned
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Movement
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8C8A] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item, reference no, room, or supplier..."
            className="input-minimal pl-10!"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8C8C8A]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-minimal w-auto"
          >
            <option value="all">All Movements (In, Out, Return)</option>
            <option value="in">Stock In (Received)</option>
            <option value="out">Stock Out (Issuance)</option>
            <option value="return">Returns to Custody</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="minimal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Type & Date
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Asset / Item
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Quantity
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Reference & Source
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Recipient / Room
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Condition & Purpose
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider text-right">
                  Logged By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F8F8F6] transition-colors">
                  {/* Type & Date */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <Badge
                        variant={tx.type === 'in' ? 'success' : tx.type === 'out' ? 'default' : 'warning'}
                        size="sm"
                        className="font-bold tracking-wider"
                      >
                        {tx.type === 'in' && <ArrowDownLeft className="w-3 h-3 mr-1" />}
                        {tx.type === 'out' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                        {tx.type === 'return' && <RotateCcw className="w-3 h-3 mr-1" />}
                        {tx.type.toUpperCase()}
                      </Badge>
                      <p className="text-[10px] text-[#8C8C8A]">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </td>

                  {/* Asset */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#141414]">{tx.itemName}</p>
                    <p className="font-mono text-[11px] text-[#4F46E5] mt-0.5">{tx.itemCode}</p>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-bold text-sm ${
                        tx.type === 'in'
                          ? 'text-[#16A34A]'
                          : tx.type === 'out'
                          ? 'text-[#DC2626]'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                    </span>
                  </td>

                  {/* Reference & Source */}
                  <td className="py-3 px-4">
                    <p className="font-mono text-[11px] text-[#141414] font-medium">{tx.referenceNo}</p>
                    <p className="text-[11px] text-[#8C8C8A] mt-0.5">{tx.supplier || 'Campus Stock'}</p>
                  </td>

                  {/* Recipient / Room */}
                  <td className="py-3 px-4">
                    {tx.roomNumber ? (
                      <Badge variant="default" size="sm">
                        Room {tx.roomNumber}
                      </Badge>
                    ) : tx.dormerName ? (
                      <span className="font-medium text-[#2C2C2A]">{tx.dormerName}</span>
                    ) : (
                      <span className="text-[#8C8C8A]">—</span>
                    )}
                  </td>

                  {/* Condition & Purpose */}
                  <td className="py-3 px-4">
                    {tx.condition && (
                      <Badge variant="neutral" size="sm" className="mb-1 uppercase text-[10px]">
                        {tx.condition.replace('_', ' ')}
                      </Badge>
                    )}
                    <p className="text-[11px] text-[#555552]">{tx.purpose || 'Routine movement'}</p>
                  </td>

                  {/* Performed By */}
                  <td className="py-3 px-4 text-right text-[11px] text-[#8C8C8A]">
                    {tx.performedBy}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#8C8C8A]">
                    No stock movements matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AppShell>
  );
}
