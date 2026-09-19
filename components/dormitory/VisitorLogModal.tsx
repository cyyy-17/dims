'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';

interface VisitorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VisitorLogModal: React.FC<VisitorLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [visitorName, setVisitorName] = useState('');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dormerVisitedId, setDormerVisitedId] = useState('');
  const [notes, setNotes] = useState('');
  const dormers = store.getDormers().filter((d) => d.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !purpose.trim()) {
      toast.error('Required Information', 'Visitor Name and Purpose are required.');
      return;
    }

    const visitedDormer = dormers.find((d) => d.id === dormerVisitedId);

    store.addVisitorLog({
      visitorName,
      contact,
      purpose,
      dormerVisitedId: visitedDormer?.id,
      dormerVisitedName: visitedDormer
        ? `${visitedDormer.firstName} ${visitedDormer.lastName}`
        : undefined,
      timeIn: new Date().toISOString(),
      notes,
    });

    toast.success('Visitor Logged In', `${visitorName} recorded in campus log.`);
    setVisitorName('');
    setContact('');
    setPurpose('');
    setDormerVisitedId('');
    setNotes('');

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Campus Visitor Entry"
      description="Record visitor identity, entry time, purpose of visit, and host dormer."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Visitor Full Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="e.g. Mrs. Cynthia Santos"
            className="input-minimal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Contact Phone</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. +63 918 555 1234"
            className="input-minimal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Purpose of Visit <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Family visitation / contractor maintenance"
            className="input-minimal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Dormer Being Visited (Optional)
          </label>
          <select
            value={dormerVisitedId}
            onChange={(e) => setDormerVisitedId(e.target.value)}
            className="input-minimal"
          >
            <option value="">-- General Campus / Contractor (No specific dormer) --</option>
            {dormers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName} ({d.type.toUpperCase()}){' '}
                {d.currentAssignment?.roomNumber ? `[Room ${d.currentAssignment.roomNumber}]` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Security / Gate Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ID surrendered at guard post, badge number, etc."
            className="input-minimal"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Record Time-In Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
