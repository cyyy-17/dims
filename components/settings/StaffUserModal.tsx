'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StaffUser, UserRole } from '@/lib/types';
import { store } from '@/lib/data-store';
import { toast } from '@/components/ui/Toast';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

interface StaffUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: StaffUser | null;
  onSaved?: () => void;
}

const StaffUserForm: React.FC<{
  userToEdit?: StaffUser | null;
  onClose: () => void;
  onSaved?: () => void;
}> = ({ userToEdit, onClose, onSaved }) => {
  const [fullName, setFullName] = useState(userToEdit?.fullName || '');
  const [email, setEmail] = useState(userToEdit?.email || '');
  const [role, setRole] = useState<UserRole>(userToEdit?.role || 'dorm_manager');
  const [designation, setDesignation] = useState(userToEdit?.designation || '');
  const [contactNo, setContactNo] = useState(userToEdit?.contactNo || '');
  const [isActive, setIsActive] = useState<boolean>(userToEdit ? userToEdit.isActive : true);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = store.getCurrentUser();
  const isEditingSelf = Boolean(
    userToEdit &&
      (userToEdit.id === currentUser.id ||
        userToEdit.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Required Field', 'Staff full name is required.');
      return;
    }
    if (!email.trim()) {
      toast.error('Required Field', 'Staff email address is required.');
      return;
    }

    if (!userToEdit) {
      if (!password) {
        toast.error('Password Required', 'An initial password is required for new accounts.');
        return;
      }
      if (password.length < 8) {
        toast.error('Password Length', 'Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Password Mismatch', 'Passwords do not match.');
        return;
      }
    } else if (password) {
      // If editing and password provided for reset
      if (password.length < 8) {
        toast.error('Password Length', 'Reset password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Password Mismatch', 'Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (userToEdit) {
        // Update user
        const res = await fetch('/api/auth/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userToEdit.id,
            email: userToEdit.email,
            fullName: fullName.trim(),
            role,
            designation: designation.trim() || 'ASR Staff',
            isActive,
            newPassword: password || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error('Update Failed', data.error || 'Failed to update staff user.');
          return;
        }

        store.updateStaffUser(userToEdit.id, {
          fullName: fullName.trim(),
          role,
          designation: designation.trim(),
          contactNo: contactNo.trim(),
          isActive,
        });

        if (isEditingSelf) {
          store.updateCurrentUser({
            fullName: fullName.trim(),
            designation: designation.trim(),
            contactNo: contactNo.trim(),
          });
        }

        toast.success('Staff Updated', `Account for ${fullName} updated successfully.`);
      } else {
        // Create user
        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            role,
            designation: designation.trim() || 'ASR Staff',
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error('Creation Failed', data.error || 'Failed to provision staff user.');
          return;
        }

        store.addStaffUser({
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          designation: designation.trim() || 'ASR Staff',
          contactNo: contactNo.trim(),
          isActive: true,
        });

        toast.success('Staff Provisioned', `New staff account created for ${fullName}.`);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error('Error', err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Full Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Maria Joy Clemente"
            className="input-minimal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            Email Address <span className="text-[#DC2626]">*</span>
          </label>
          <input
            type="email"
            required
            disabled={!!userToEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@school.edu.ph"
            className="input-minimal disabled:bg-[#F4F4F2]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
            System Role & Permissions <span className="text-[#DC2626]">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isEditingSelf}
            className="input-minimal"
          >
            <option value="dorm_manager">Dormitory Manager (Residents, Rooms, Check-In)</option>
            <option value="inventory_officer">Inventory Officer (Assets, Stock, QR Tags)</option>
            <option value="super_admin">Super Administrator (Full System Control)</option>
            <option value="viewer">Auditor / Viewer (Read-Only Access)</option>
          </select>
          {isEditingSelf && (
            <p className="text-[10px] text-[#8C8C8A] mt-1">
              You cannot modify your own Super Admin role permissions.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Official Designation</label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Assistant Dormitory Custodian"
            className="input-minimal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Contact Phone</label>
          <input
            type="text"
            value={contactNo}
            onChange={(e) => setContactNo(e.target.value)}
            placeholder="+63 9XX XXX XXXX"
            className="input-minimal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Account Status</label>
          <select
            value={isActive ? 'active' : 'inactive'}
            onChange={(e) => setIsActive(e.target.value === 'active')}
            disabled={isEditingSelf}
            className="input-minimal"
          >
            <option value="active">Active (Full Login Access)</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
          {isEditingSelf && (
            <p className="text-[10px] text-[#8C8C8A] mt-1">
              You cannot suspend your own active Super Admin session.
            </p>
          )}
        </div>
      </div>

      {/* Password Management Block */}
      <div className="pt-3 border-t border-[#E4E4E0] space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#141414]">
          <KeyRound className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span>{userToEdit ? 'Reset User Password (Optional)' : 'Initial Account Password'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
              {userToEdit ? 'New Password' : 'Password'}{' '}
              {!userToEdit && <span className="text-[#DC2626]">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={userToEdit ? 'Leave blank to keep unchanged' : 'Min 8 characters'}
                className="input-minimal pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-[#8C8C8A] hover:text-[#141414]"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="input-minimal"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : userToEdit
            ? 'Save Changes'
            : 'Provision Staff User'}
        </Button>
      </div>
    </form>
  );
};

export const StaffUserModal: React.FC<StaffUserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaved,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? `Edit Staff Account: ${userToEdit.fullName}` : 'Provision New Staff Member'}
      description="Super Admin credential provisioning and role management."
      maxWidth="md"
    >
      {isOpen && (
        <StaffUserForm
          key={userToEdit ? userToEdit.id : 'new-staff'}
          userToEdit={userToEdit}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
};
