'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DoorOpen,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  GraduationCap,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { DormerModal } from '@/components/dormitory/DormerModal';
import { StockTransactionModal } from '@/components/inventory/StockTransactionModal';
import { ComposeAnnouncementModal } from '@/components/announcements/ComposeAnnouncementModal';
import { formatDateTime } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(store.getDashboardMetrics());
  const [isDormerModalOpen, setIsDormerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMetrics(store.getDashboardMetrics());
    });
    return unsub;
  }, []);

  // Prepare chart data
  const occupancyChartData = [
    { name: 'Available', value: metrics.roomStatusCounts.available, color: '#16A34A' },
    { name: 'Partial', value: metrics.roomStatusCounts.partial, color: '#D97706' },
    { name: 'Full', value: metrics.roomStatusCounts.full, color: '#4F46E5' },
    { name: 'Maintenance', value: metrics.roomStatusCounts.maintenance, color: '#8C8C8A' },
  ].filter((d) => d.value > 0);

  const demographicChartData = [
    { name: 'Students', count: metrics.dormerDemographics.students, color: '#4F46E5' },
    { name: 'Employees', count: metrics.dormerDemographics.employees, color: '#0284C7' },
    { name: 'Visitors', count: metrics.dormerDemographics.visitors, color: '#8B5CF6' },
  ];

  const stockInventoryChartData = store
    .getItems()
    .slice(0, 6)
    .map((item) => ({
      name: item.name.length > 16 ? `${item.name.slice(0, 14)}...` : item.name,
      stock: item.currentStock,
      min: item.minStock,
    }));

  return (
    <AppShell>
      {/* Top Banner / Executive Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Executive Operations Dashboard
            </h1>
            <Badge variant="default" size="sm" dot>
              Live Feed
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            ASR Field Campus Dormitory & Physical Asset Custody Control Center
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsStockModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-[#16A34A]" />
            Stock In / Out
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsAnnouncementModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#4F46E5]" />
            Send Notice
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsDormerModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Dormer
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (Swiss Minimalist Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Occupancy */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Occupancy Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#141414]">
              {metrics.occupancyRate}%
            </div>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              {metrics.totalOccupants} of {metrics.totalCapacity} total beds filled
            </p>
          </div>
          <div className="w-full bg-[#ECECE8] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#4F46E5] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.occupancyRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Total Active Dormers */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Active Residents
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#141414]">
              {metrics.dormerDemographics.total}
            </div>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              Across 3 dormer categories
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#555552]">
            <span>{metrics.dormerDemographics.students} Stu</span> ·
            <span>{metrics.dormerDemographics.employees} Emp</span> ·
            <span>{metrics.dormerDemographics.visitors} Vis</span>
          </div>
        </div>

        {/* KPI 3: Rooms Count */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Dormitory Rooms
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#141414]">
              {metrics.totalRooms}
            </div>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              {metrics.roomStatusCounts.available} Available · {metrics.roomStatusCounts.full} Full
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {metrics.roomStatusCounts.available} Open
            </Badge>
            {metrics.roomStatusCounts.maintenance > 0 && (
              <Badge variant="neutral" size="sm">
                {metrics.roomStatusCounts.maintenance} Repair
              </Badge>
            )}
          </div>
        </div>

        {/* KPI 4: Total Inventory Items */}
        <div className="minimal-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Physical Assets
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F8F8F6] text-[#141414] border border-[#E4E4E0] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#141414]">
              {metrics.inventoryHealth.totalAssetsQuantity}
            </div>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              {metrics.inventoryHealth.totalItemsCount} catalog item types
            </p>
          </div>
          <Link
            href="/inventory/items"
            className="text-[11px] text-[#4F46E5] hover:underline flex items-center gap-1 font-medium"
          >
            View inventory catalog <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* KPI 5: Stock Attention Alerts */}
        <div className="minimal-card p-5 space-y-3 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Stock Alerts
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[#141414]">
              {metrics.inventoryHealth.lowStockCount + metrics.inventoryHealth.outOfStockCount}
            </div>
            <p className="text-[11px] text-[#8C8C8A] mt-0.5">
              {metrics.inventoryHealth.outOfStockCount} Out · {metrics.inventoryHealth.lowStockCount} Low
            </p>
          </div>
          <div>
            {metrics.inventoryHealth.outOfStockCount > 0 ? (
              <Badge variant="danger" size="sm" dot>
                Immediate Action Required
              </Badge>
            ) : metrics.inventoryHealth.lowStockCount > 0 ? (
              <Badge variant="warning" size="sm" dot>
                Restock Recommended
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                All Safe
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Row (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Occupancy Breakdown */}
        <div className="minimal-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Room Occupancy Status
              </h3>
              <p className="text-[11px] text-[#8C8C8A]">Real-time room allocations</p>
            </div>
            <Link href="/dormitory/rooms" className="text-xs text-[#4F46E5] hover:underline font-medium">
              Manage Rooms
            </Link>
          </div>

          {occupancyChartData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4">
              <DoorOpen className="w-8 h-8 text-[#D4D4D0] mb-2" />
              <p className="text-xs text-[#8C8C8A]">No room occupancy records yet.</p>
              <Link href="/dormitory/rooms" className="text-xs text-[#4F46E5] hover:underline mt-1 font-medium">
                Manage rooms &rarr;
              </Link>
            </div>
          ) : (
            <>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyChartData}
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {occupancyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E4E0]">
                {occupancyChartData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[#555552]">{d.name}:</span>
                    <strong className="text-[#141414] ml-auto">{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Chart 2: Dormer Demographics */}
        <div className="minimal-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Dormer Demographics
              </h3>
              <p className="text-[11px] text-[#8C8C8A]">Students, employees, visitors</p>
            </div>
            <Link href="/dormitory/dormers" className="text-xs text-[#4F46E5] hover:underline font-medium">
              Masterlist
            </Link>
          </div>

          <div className="space-y-4 pt-2">
            {demographicChartData.map((d) => {
              const pct =
                metrics.dormerDemographics.total > 0
                  ? Math.round((d.count / metrics.dormerDemographics.total) * 100)
                  : 0;
              return (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#141414] flex items-center gap-1.5">
                      {d.name === 'Students' && <GraduationCap className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      {d.name === 'Employees' && <Briefcase className="w-3.5 h-3.5 text-[#0284C7]" />}
                      {d.name === 'Visitors' && <UserCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                      {d.name}
                    </span>
                    <span className="text-[#8C8C8A]">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#ECECE8] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-[11px] text-[#555552] mt-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>All residents verified with emergency contacts & ID records.</span>
          </div>
        </div>

        {/* Chart 3: Inventory Stock Health Bar Chart */}
        <div className="minimal-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Top Stock Quantities
              </h3>
              <p className="text-[11px] text-[#8C8C8A]">In-stock vs minimum threshold</p>
            </div>
            <Link href="/inventory/stock" className="text-xs text-[#4F46E5] hover:underline font-medium">
              Ledger
            </Link>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockInventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8C8C8A' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8C8C8A' }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-[#E4E4E0] flex items-center justify-between text-xs">
            <span className="text-[#8C8C8A]">Need stock replenishment?</span>
            <Button size="sm" variant="secondary" onClick={() => setIsStockModalOpen(true)}>
              + Stock Movement
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity Feed & Stock Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Transactions Ledger */}
        <div className="minimal-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Recent Asset Movements
              </h3>
            </div>
            <Link href="/inventory/stock" className="text-xs text-[#4F46E5] hover:underline font-medium">
              Full Ledger
            </Link>
          </div>

          {metrics.recentTransactions.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No stock movements yet"
              description="Record your first stock-in or stock-out to populate the asset ledger."
              actionText="Record Movement"
              onAction={() => setIsStockModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-[#E4E4E0]">
              {metrics.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tx.type === 'in' ? 'success' : tx.type === 'out' ? 'default' : 'warning'}
                        size="sm"
                      >
                        {tx.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-[#141414]">{tx.itemName}</span>
                    </div>
                    <p className="text-[11px] text-[#8C8C8A] mt-0.5">
                      {tx.purpose || 'General issuance'} {tx.roomNumber ? `· Room ${tx.roomNumber}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#141414]">
                      {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                    </span>
                    <p className="text-[10px] text-[#8C8C8A]">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Stream */}
        <div className="minimal-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Activity Audit Trail
              </h3>
            </div>
            <span className="text-[10px] uppercase font-mono text-[#8C8C8A]">Immutable</span>
          </div>

          {metrics.recentActivityLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8C8C8A]">
              No activity has been recorded yet. Actions you take will appear here.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {metrics.recentActivityLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#F8F8F6] border border-[#ECECE8] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-[10px] uppercase text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-[#8C8C8A]">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="text-[#2C2C2A] leading-relaxed">{log.detail}</p>
                  <p className="text-[10px] text-[#8C8C8A] mt-1 font-mono">Actor: {log.actorName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DormerModal
        isOpen={isDormerModalOpen}
        onClose={() => setIsDormerModalOpen(false)}
      />
      <StockTransactionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
      <ComposeAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
    </AppShell>
  );
}
