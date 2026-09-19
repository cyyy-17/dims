'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DormerModal } from '../dormitory/DormerModal';
import { StockTransactionModal } from '../inventory/StockTransactionModal';
import { ComposeAnnouncementModal } from '../announcements/ComposeAnnouncementModal';
import { store } from '@/lib/data-store';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDormerModalOpen, setIsDormerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  useEffect(() => {
    store.syncFromSupabase();

    const handleOnline = () => {
      store.syncFromSupabase();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F8F8F6]">
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenQuickDormer={() => setIsDormerModalOpen(true)}
          onOpenQuickStock={() => setIsStockModalOpen(true)}
          onOpenQuickAnnouncement={() => setIsAnnouncementModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Global Quick Action Modals */}
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
    </div>
  );
};
