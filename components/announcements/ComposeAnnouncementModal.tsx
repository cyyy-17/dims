'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { AnnouncementAudience } from '@/lib/types';
import { Send, Eye, Users, CheckCircle2, AlertCircle, CloudLightning, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposeAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ComposeFormContent: React.FC<{
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('all');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const rooms = store.getRooms();
  const dormers = store.getDormers().filter((d) => d.status === 'active');
  const settings = store.getSettings();
  const isSimulationMode = !settings.brevoApiKey || settings.brevoApiKey.includes('your-brevo') || settings.brevoApiKey.trim() === '';

  const matchingDormers = dormers.filter((d) => {
    if (targetAudience === 'all') return true;
    if (targetAudience === 'students') return d.type === 'student';
    if (targetAudience === 'employees') return d.type === 'employee';
    if (targetAudience === 'visitors') return d.type === 'visitor';
    if (targetAudience === 'room') return d.currentAssignment?.roomId === targetRoomId;
    return false;
  });

  const selectedRoom = rooms.find((r) => r.id === targetRoomId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Required Information', 'Please enter an announcement title and message body.');
      return;
    }

    if (matchingDormers.length === 0) {
      toast.error('No Recipients Found', 'No active dormers found matching your target filter.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await store.sendAnnouncement({
        title,
        body,
        targetAudience,
        targetRoomId: targetAudience === 'room' ? targetRoomId : undefined,
        targetRoomNumber: selectedRoom?.roomNumber,
      });

      setSendResult({
        success: res.success,
        message: res.message,
      });

      if (res.success) {
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1800);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dispatch email';
      setSendResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-5">
      {/* Delivery Engine Mode Status */}
      <div className="flex items-center justify-between p-2.5 bg-[#F8F8F6] border border-[#E4E4E0] rounded-xl text-xs">
        <div className="flex items-center gap-2">
          {isSimulationMode ? (
            <>
              <ShieldAlert className="w-4 h-4 text-[#D97706]" />
              <div>
                <span className="font-semibold text-[#141414]">Standalone Simulation Active</span>
                <p className="text-[11px] text-[#8C8C8A]">Dispatches realistic local preview receipts without external API charges.</p>
              </div>
            </>
          ) : (
            <>
              <CloudLightning className="w-4 h-4 text-[#4F46E5]" />
              <div>
                <span className="font-semibold text-[#141414]">Brevo Cloud Delivery Connected</span>
                <p className="text-[11px] text-[#8C8C8A]">Real transactional & bulk emails dispatched to dormer inboxes.</p>
              </div>
            </>
          )}
        </div>
        <Badge variant={isSimulationMode ? 'warning' : 'success'} size="sm">
          {isSimulationMode ? 'Simulation Mode' : 'Cloud Active'}
        </Badge>
      </div>

      {/* Audience Filter Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#141414] uppercase tracking-wider">
            Target Audience
          </label>
          <Badge variant="default" size="sm" className="font-mono">
            <Users className="w-3 h-3 mr-1" />
            {matchingDormers.length} Dormers Targeted
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'all', label: 'All Dormers' },
            { id: 'students', label: 'Students' },
            { id: 'employees', label: 'Employees' },
            { id: 'visitors', label: 'Visitors' },
            { id: 'room', label: 'By Room' },
          ].map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setTargetAudience(a.id as AnnouncementAudience)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all',
                targetAudience === a.id
                  ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                  : 'border-[#E4E4E0] bg-white text-[#2C2C2A] hover:bg-[#F8F8F6]'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        {targetAudience === 'room' && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              Select Specific Room
            </label>
            <select
              required
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className="input-minimal"
            >
              <option value="">-- Choose Room --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.occupants?.length || 0} active occupants)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Title & Body */}
      <div>
        <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
          Announcement Subject / Title <span className="text-[#DC2626]">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Scheduled Water Cistern Sanitation & Low Pressure Notice"
          className="input-minimal"
        />
      </div>

      {/* Message Input or Preview Toggle */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-[#2C2C2A]">
            Message Content <span className="text-[#DC2626]">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            {isPreviewMode ? 'Back to Edit' : 'Preview Branded Email'}
          </button>
        </div>

        {isPreviewMode ? (
          <div className="p-5 rounded-xl border border-[#E4E4E0] bg-[#F8F8F6] space-y-3">
            <div className="bg-white rounded-lg p-5 border border-[#E4E4E0] shadow-xs">
              <div className="border-b border-[#E4E4E0] pb-2 mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4F46E5]">
                  Official ASR Notice
                </span>
                <span className="text-[11px] text-[#8C8C8A]">St. Augustine Academy DIMS</span>
              </div>
              <h4 className="text-base font-bold text-[#141414] mb-2">{title || 'Subject Line Preview'}</h4>
              <div className="text-xs text-[#2C2C2A] whitespace-pre-line leading-relaxed">
                {body || 'Your announcement text will be formatted in clean typography here.'}
              </div>
              <div className="mt-6 pt-3 border-t border-[#E4E4E0] text-[10px] text-[#8C8C8A] text-center">
                Sent to {matchingDormers.length} registered residents via Brevo Mailer.
              </div>
            </div>
          </div>
        ) : (
          <textarea
            rows={5}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your official announcement here. Keep instructions clear and actionable..."
            className="input-minimal leading-relaxed"
          />
        )}
      </div>

      {/* Dispatch Feedback Alert */}
      {sendResult && (
        <div
          className={cn(
            'p-3 rounded-lg text-xs flex items-start gap-2.5',
            sendResult.success
              ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]'
          )}
        >
          {sendResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              {sendResult.success ? 'Announcement Dispatched!' : 'Dispatch Notice'}
            </p>
            <p className="text-[11px] mt-0.5">{sendResult.message}</p>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E0]">
        <span className="text-[11px] text-[#8C8C8A]">
          Powered by Brevo Bulk Email Engine
        </span>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSending}
            disabled={matchingDormers.length === 0}
            className="flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send to {matchingDormers.length} Dormers
          </Button>
        </div>
      </div>
    </form>
  );
};

export const ComposeAnnouncementModal: React.FC<ComposeAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Announcement & Brevo Bulk Email"
      description="Send broadcast notifications to dormers with automated email delivery."
      maxWidth="xl"
    >
      {isOpen && (
        <ComposeFormContent
          key={isOpen ? 'open' : 'closed'}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};
