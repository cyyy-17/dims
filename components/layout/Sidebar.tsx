'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  ClipboardList,
  Mail,
  Package,
  ArrowLeftRight,
  Boxes,
  FileBarChart,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { store } from '@/lib/data-store';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = false,
  onClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [staffName] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('dims_staff_name') ||
        store.getSettings().dormitoryLeadName ||
        'ASR Staff Representative'
      );
    }
    return 'ASR Staff Representative';
  });

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('dims_authenticated');
      router.push('/login');
    }
  };

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      label: 'DORMITORY',
      items: [
        { name: 'Rooms & Beds', href: '/dormitory/rooms', icon: DoorOpen },
        { name: 'Dormers (All Types)', href: '/dormitory/dormers', icon: Users },
        { name: 'Visitor Log', href: '/dormitory/visitor-log', icon: ClipboardList },
        { name: 'Announcements & Email', href: '/dormitory/announcements', icon: Mail },
      ],
    },
    {
      label: 'INVENTORY & ASSETS',
      items: [
        { name: 'Item Catalog', href: '/inventory/items', icon: Package },
        { name: 'Stock Movements', href: '/inventory/stock', icon: ArrowLeftRight },
        { name: 'Room Assigned Items', href: '/inventory/room-items', icon: Boxes },
      ],
    },
    {
      label: 'EXECUTIVE',
      items: [
        { name: 'Reports & Export', href: '/reports', icon: FileBarChart },
        { name: 'Settings & Cloud DB', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E4E4E0] flex flex-col transition-transform duration-200 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E4E4E0]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-[#141414]">DIMS</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] font-semibold">
                  ASR
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C8A] leading-none">Dormitory & Inventory</p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold tracking-wider text-[#8C8C8A] uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold border-l-2 border-[#4F46E5] pl-[10px]'
                          : 'text-[#555552] hover:bg-[#F8F8F6] hover:text-[#141414] border-l-2 border-transparent pl-[10px]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-[#4F46E5]' : 'text-[#8C8C8A] group-hover:text-[#141414]'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Campus Status & Officer Chip */}
        <div className="p-3 border-t border-[#E4E4E0] bg-[#FAFAF9]/80 space-y-2.5">
          <div className="px-3 py-2.5 rounded-lg bg-white border border-[#E4E4E0] shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#141414]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                ASR Field Complex
              </span>
              <span className="text-[9px] text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded font-mono font-medium">OFFICE</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#F2F2EF]">
              <div>
                <p className="text-[11px] font-semibold text-[#141414] leading-tight">{staffName}</p>
                <p className="text-[10px] text-[#8C8C8A]">ASR Staff Representative</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out of DIMS"
                className="p-1.5 rounded-md text-[#8C8C8A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-2 flex items-center justify-between text-[10px] text-[#8C8C8A]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#16A34A]" /> RLS Protected
            </span>
            <span>v2.0 Minimal</span>
          </div>
        </div>
      </aside>
    </>
  );
};
