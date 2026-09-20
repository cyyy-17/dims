'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Bell,
  Search,
  Plus,
  AlertTriangle,
  Mail,
  UserPlus,
  PackagePlus,
  CalendarCheck,
  CheckCircle2,
  RefreshCw,
  CloudOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { store } from '@/lib/data-store';
import { Dormer, Room, InventoryItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  onOpenQuickDormer?: () => void;
  onOpenQuickStock?: () => void;
  onOpenQuickAnnouncement?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  onOpenQuickDormer,
  onOpenQuickStock,
  onOpenQuickAnnouncement,
}) => {
  const router = useRouter();
  const [metrics, setMetrics] = useState(store.getDashboardMetrics());
  const [syncStatus, setSyncStatus] = useState(store.getSyncStatus());
  const [pendingCount, setPendingCount] = useState(store.getPendingQueueCount());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const quickMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery('');
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMetrics(store.getDashboardMetrics());
      setSyncStatus(store.getSyncStatus());
      setPendingCount(store.getPendingQueueCount());
    });
    return unsub;
  }, []);

  // Compute search results directly using useMemo (no cascading setState in effects)
  const searchResults = useMemo<{
    dormers: Dormer[];
    rooms: Room[];
    items: InventoryItem[];
  } | null>(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchedDormers = store
      .getDormers()
      .filter((d) =>
        `${d.firstName} ${d.lastName} ${d.email} ${d.studentIdNo || ''} ${d.employeeIdNo || ''} ${d.externalId || ''}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 4);

    const matchedRooms = store
      .getRooms()
      .filter((r) => `room ${r.roomNumber} ${r.type} ${r.wing}`.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedItems = store
      .getItems()
      .filter((i) => `${i.name} ${i.itemCode} ${i.categoryName}`.toLowerCase().includes(q))
      .slice(0, 4);

    return { dormers: matchedDormers, rooms: matchedRooms, items: matchedItems };
  }, [searchQuery]);

  const totalAlerts = metrics.inventoryHealth.lowStockCount + metrics.inventoryHealth.outOfStockCount;

  return (
    <header className="h-16 px-4 md:px-8 border-b border-[#E4E4E0] bg-white flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          type="button"
          aria-label="Toggle Navigation Menu"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#555552] hover:bg-[#F8F8F6] focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input with Popover */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="search-box-minimal">
            <Search className="w-4 h-4 shrink-0 text-[#8C8C8A]" />
            <input
              type="text"
              aria-label="Search rooms, dormers, or assets"
              placeholder="Quick search room, dormer, or asset code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search input"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-[#8C8C8A] hover:text-[#141414] px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-[#E4E4E0] shadow-xl p-3 z-50 max-h-96 overflow-y-auto space-y-3">
              {searchResults.dormers.length === 0 &&
              searchResults.rooms.length === 0 &&
              searchResults.items.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#8C8C8A]">
                  No matching rooms, dormers, or assets found.
                </div>
              ) : null}

              {/* Dormers result */}
              {searchResults.dormers.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#8C8C8A] uppercase tracking-wider px-2 mb-1">
                    Dormers ({searchResults.dormers.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.dormers.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSearchQuery('');
                          router.push(`/dormitory/dormers?openId=${d.id}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8F6] cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-[#141414]">
                            {d.firstName} {d.lastName}
                          </p>
                          <p className="text-[11px] text-[#8C8C8A]">
                            {d.type.toUpperCase()} · {d.email}
                          </p>
                        </div>
                        {d.currentAssignment?.roomNumber ? (
                          <Badge variant="default" size="sm">
                            Room {d.currentAssignment.roomNumber}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rooms result */}
              {searchResults.rooms.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#8C8C8A] uppercase tracking-wider px-2 mb-1">
                    Rooms ({searchResults.rooms.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.rooms.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setSearchQuery('');
                          router.push(`/dormitory/rooms?roomId=${r.id}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8F6] cursor-pointer text-xs"
                      >
                        <span className="font-semibold text-[#141414]">
                          Room {r.roomNumber} ({r.type})
                        </span>
                        <Badge
                          variant={
                            r.status === 'available'
                              ? 'success'
                              : r.status === 'full'
                              ? 'default'
                              : r.status === 'partial'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items result */}
              {searchResults.items.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#8C8C8A] uppercase tracking-wider px-2 mb-1">
                    Inventory Items ({searchResults.items.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.items.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setSearchQuery('');
                          router.push(`/inventory/items?qrId=${i.id}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8F8F6] cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-semibold text-[#141414]">{i.name}</p>
                          <p className="text-[11px] text-[#8C8C8A] font-mono">{i.itemCode}</p>
                        </div>
                        <span className="font-mono font-medium text-[#141414]">
                          {i.currentStock} {i.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Action & Alert Bell */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Cloud Sync Status Indicator */}
        <button
          type="button"
          aria-label="Cloud Sync Status"
          title={
            syncStatus === 'synced'
              ? 'Data synchronized with Supabase cloud. Click to pull latest changes.'
              : syncStatus === 'syncing'
              ? 'Synchronizing with cloud...'
              : syncStatus === 'offline'
              ? 'You are currently offline. Changes are stored locally and will sync when reconnected.'
              : `${pendingCount} offline change(s) queued. Click to retry sync.`
          }
          onClick={() => store.syncFromSupabase()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            syncStatus === 'synced'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534] hover:bg-[#DCFCE7]'
              : syncStatus === 'syncing'
              ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]'
              : syncStatus === 'offline'
              ? 'bg-[#F4F4F5] border-[#E4E4E7] text-[#71717A]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]'
          }`}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-3 h-3 animate-spin text-[#4F46E5]" />
          ) : syncStatus === 'offline' ? (
            <CloudOff className="w-3 h-3 text-[#71717A]" />
          ) : syncStatus === 'pending' ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
            </span>
          )}

          <span className="hidden sm:inline">
            {syncStatus === 'synced' && 'Cloud Synced'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'offline' && 'Offline'}
            {syncStatus === 'pending' && `${pendingCount} Queued`}
          </span>
        </button>

        {/* Quick Action Trigger Button */}
        <div ref={quickMenuRef} className="relative">
          <Button
            size="sm"
            variant="primary"
            aria-label="Open Quick Action Menu"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Action</span>
          </Button>

          {/* Quick Action Dropdown */}
          {showQuickMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-[#E4E4E0] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowQuickMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickDormer) onOpenQuickDormer();
                  else router.push('/dormitory/dormers');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2C2A] hover:bg-[#EEF2FF] hover:text-[#4F46E5] rounded-lg transition-colors text-left"
              >
                <UserPlus className="w-4 h-4 text-[#4F46E5]" />
                <span>Register Dormer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickStock) onOpenQuickStock();
                  else router.push('/inventory/stock');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2C2A] hover:bg-[#EEF2FF] hover:text-[#4F46E5] rounded-lg transition-colors text-left"
              >
                <PackagePlus className="w-4 h-4 text-[#16A34A]" />
                <span>Record Stock In / Out</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickAnnouncement) onOpenQuickAnnouncement();
                  else router.push('/dormitory/announcements');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2C2C2A] hover:bg-[#EEF2FF] hover:text-[#4F46E5] rounded-lg transition-colors text-left"
              >
                <Mail className="w-4 h-4 text-[#D97706]" />
                <span>Compose Announcement</span>
              </button>

              <div className="border-t border-[#E4E4E0] my-1" />

              <button
                type="button"
                onClick={() => router.push('/dormitory/visitor-log')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#555552] hover:bg-[#F8F8F6] rounded-lg transition-colors text-left"
              >
                <CalendarCheck className="w-4 h-4 text-[#8C8C8A]" />
                <span>Log Visitor Entry</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            aria-label="View Campus Stock Alerts"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[#555552] hover:bg-[#F8F8F6] hover:text-[#141414] transition-colors border border-[#E4E4E0] cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-[#E4E4E0] shadow-xl p-4 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E0]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                  Operational Alerts
                </h4>
                <Badge variant={totalAlerts > 0 ? 'warning' : 'success'} size="sm">
                  {totalAlerts} Attention
                </Badge>
              </div>

              <div className="py-2 space-y-2.5 max-h-72 overflow-y-auto">
                {metrics.inventoryHealth.outOfStockCount > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#DC2626]">
                        {metrics.inventoryHealth.outOfStockCount} Item Out of Stock
                      </p>
                      <p className="text-[11px] text-[#7F1D1D] mt-0.5">
                        {metrics.inventoryHealth.outOfStockItems.map((i) => i.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {metrics.inventoryHealth.lowStockCount > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#D97706]">
                        {metrics.inventoryHealth.lowStockCount} Items Low in Stock
                      </p>
                      <p className="text-[11px] text-[#92400E] mt-0.5">
                        {metrics.inventoryHealth.lowStockItems.map((i) => `${i.name} (${i.currentStock})`).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <div className="text-center py-6 text-xs text-[#8C8C8A]">
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-1.5" />
                    All inventory levels and room allocations are within optimal limits.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
