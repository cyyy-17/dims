'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { Announcement, Dormer } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ComposeAnnouncementModal } from '@/components/announcements/ComposeAnnouncementModal';
import {
  Mail,
  Send,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(store.getAnnouncements());
  const [dormers, setDormers] = useState<Dormer[]>(store.getDormers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setAnnouncements(store.getAnnouncements());
      setDormers(store.getDormers());
    });
    return unsub;
  }, []);

  const getRecipientDormers = (ann: Announcement) => {
    return dormers.filter((d) => {
      if (ann.targetAudience === 'all') return d.status === 'active';
      if (ann.targetAudience === 'students') return d.type === 'student' && d.status === 'active';
      if (ann.targetAudience === 'employees') return d.type === 'employee' && d.status === 'active';
      if (ann.targetAudience === 'visitors') return d.type === 'visitor' && d.status === 'active';
      if (ann.targetAudience === 'room') return d.currentAssignment?.roomNumber === ann.targetRoomNumber;
      return true;
    });
  };

  return (
    <AppShell>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Announcements &amp; Bulk Email
            </h1>
            <Badge variant="default" size="sm">
              {announcements.length} Sent
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Dispatch official campus announcements to dormers via Brevo cloud bulk email.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Compose New Announcement
        </Button>
      </div>

      {/* Brevo Integration Card Banner */}
      <div className="p-4 rounded-xl bg-linear-to-r from-[#EEF2FF] to-white border border-[#C7D2FE]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#141414]">Brevo Transactional & Marketing Email Service</p>
            <p className="text-[11px] text-[#555552]">
              Configured for automated multi-recipient delivery with Swiss Minimalist HTML email layouts.
            </p>
          </div>
        </div>

        <Link href="/settings">
          <Button size="sm" variant="secondary" className="text-xs shrink-0">
            Configure Brevo API Key
          </Button>
        </Link>
      </div>

      {/* Announcements Stream / Grid */}
      <div className="space-y-4">
        {announcements.map((ann) => {
          const isExpanded = expandedId === ann.id;
          const targetedDormers = getRecipientDormers(ann);

          return (
            <div key={ann.id} className="minimal-card p-5 space-y-3 minimal-card-hover">
              {/* Top row: Audience & Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E4E0] pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      ann.targetAudience === 'all'
                        ? 'default'
                        : ann.targetAudience === 'students'
                        ? 'success'
                        : ann.targetAudience === 'employees'
                        ? 'accent'
                        : 'warning'
                    }
                    size="sm"
                  >
                    Target: {ann.targetAudience.toUpperCase()}
                    {ann.targetRoomNumber ? ` (Room ${ann.targetRoomNumber})` : ''}
                  </Badge>

                  <span className="text-xs text-[#8C8C8A] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
                    Dispatched to <strong>{ann.sentToCount}</strong> recipients
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#8C8C8A]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateTime(ann.sentAt || ann.createdAt)}</span>
                </div>
              </div>

              {/* Announcement Title & Message Body */}
              <div>
                <h3 className="text-base font-bold text-[#141414] tracking-tight">{ann.title}</h3>
                <p className="text-xs text-[#2C2C2A] whitespace-pre-line leading-relaxed mt-2 bg-[#FAFAF9] p-3.5 rounded-lg border border-[#ECECE8]">
                  {ann.body}
                </p>
              </div>

              {/* Footer details & Expandable Recipient Details Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#8C8C8A] border-t border-[#F2F2EF]">
                <span>Author: {ann.createdBy}</span>
                <div className="flex items-center gap-2">
                  {ann.brevoMessageId && (
                    <span className="font-mono text-[10px] bg-[#F2F2EF] px-2 py-0.5 rounded text-[#555552]">
                      ID: {ann.brevoMessageId.slice(0, 18)}...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-md transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Recipient List' : `View Recipients (${ann.sentToCount})`}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <Badge variant="success" size="sm" dot>
                    Dispatched
                  </Badge>
                </div>
              </div>

              {/* Expandable Recipient Details Panel */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#E4E4E0] bg-[#F8F8F6] p-3.5 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#141414] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#4F46E5]" />
                      Recipient Dispatch Manifest
                    </p>
                    <span className="text-[10px] text-[#8C8C8A] font-mono">
                      {targetedDormers.length} active dormer contacts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {targetedDormers.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E4E4E0] text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-[#141414] truncate">
                            {d.firstName} {d.lastName}
                          </p>
                          <p className="text-[10px] text-[#8C8C8A] truncate">{d.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[#16A34A] text-[10px]">
                          <CheckCircle className="w-3 h-3" />
                          <span>Sent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {announcements.length === 0 && (
          <EmptyState
            icon={Mail}
            title="No Announcements Dispatched"
            description="Send official notices to students, employees, or visitors via Brevo cloud bulk email."
            actionText="Compose First Announcement"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      <ComposeAnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AppShell>
  );
}
