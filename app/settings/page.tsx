'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { AppSettings, ActivityLog, StaffUser } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { sendBrevoAnnouncement } from '@/lib/brevo';
import { StaffUserModal } from '@/components/settings/StaffUserModal';
import {
  Mail,
  Database,
  Building2,
  Clock,
  Save,
  CheckCircle2,
  Send,
  Download,
  User,
  Users,
  KeyRound,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { exportToCsv } from '@/lib/csv';

type SettingsTabId = 'profile' | 'users' | 'system' | 'brevo' | 'supabase' | 'audit';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const SETTINGS_TABS: SettingsTab[] = [
  { id: 'profile', label: '1. My Profile & Password', icon: User },
  { id: 'users', label: '2. Staff Accounts & Roles', icon: Users, superAdminOnly: true },
  { id: 'system', label: '3. Campus & System Info', icon: Building2 },
  { id: 'brevo', label: '4. Brevo Email Engine', icon: Mail },
  { id: 'supabase', label: '5. Supabase Cloud DB', icon: Database },
  { id: 'audit', label: '6. Immutable Audit Trail', icon: Clock },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as SettingsTabId | null;

  const [settings, setSettings] = useState<AppSettings>(store.getSettings());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(store.getActivityLogs());
  const [currentUser, setCurrentUser] = useState<StaffUser>(store.getCurrentUser());
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(store.getStaffUsers());
  const [selectedTab, setSelectedTab] = useState<SettingsTabId | null>(null);

  const activeTab: SettingsTabId = useMemo(() => {
    if (selectedTab) {
      if (selectedTab === 'users' && currentUser.role !== 'super_admin') return 'profile';
      return selectedTab;
    }
    if (requestedTab && ['profile', 'users', 'system', 'brevo', 'supabase', 'audit'].includes(requestedTab)) {
      if (requestedTab === 'users' && currentUser.role !== 'super_admin') {
        return 'profile';
      }
      return requestedTab;
    }
    return 'profile';
  }, [selectedTab, requestedTab, currentUser.role]);

  // Self-Service Profile Form State
  const [profileFullName, setProfileFullName] = useState(currentUser.fullName);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileDesignation, setProfileDesignation] = useState(currentUser.designation);
  const [profileContact, setProfileContact] = useState(currentUser.contactNo || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Self-Service Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Super Admin Staff Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<StaffUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // System Config Form State
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [campusName, setCampusName] = useState(settings.campusName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [dormitoryLeadName, setDormitoryLeadName] = useState(settings.dormitoryLeadName);
  const [dormitoryLeadContact, setDormitoryLeadContact] = useState(settings.dormitoryLeadContact);

  // Brevo
  const [brevoApiKey, setBrevoApiKey] = useState(settings.brevoApiKey || '');
  const [brevoSenderEmail, setBrevoSenderEmail] = useState(settings.brevoSenderEmail || '');
  const [brevoSenderName, setBrevoSenderName] = useState(settings.brevoSenderName || '');
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Audit
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PER_PAGE = 25;

  // Feedback banner
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Synchronize store data
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSettings(store.getSettings());
      setActivityLogs(store.getActivityLogs());
      const updatedUser = store.getCurrentUser();
      setCurrentUser(updatedUser);
      setProfileFullName(updatedUser.fullName);
      setProfileEmail(updatedUser.email);
      setProfileDesignation(updatedUser.designation);
      setProfileContact(updatedUser.contactNo || '');
      setStaffUsers(store.getStaffUsers());
    });
    return unsub;
  }, []);

  // Fetch live staff users from API for Super Admins
  useEffect(() => {
    if (currentUser.role === 'super_admin') {
      fetch('/api/auth/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.users) && data.users.length > 0) {
            data.users.forEach((u: StaffUser) => {
              const existing = store.getStaffUsers().find(
                (su) => su.id === u.id || su.email.toLowerCase() === u.email.toLowerCase()
              );
              if (existing) {
                store.updateStaffUser(existing.id, u);
              } else {
                store.addStaffUser(u);
              }
            });
          }
        })
        .catch(() => {
          // Keep local store fallback
        });
    }
  }, [currentUser.role]);

  // Password validation rules
  const passwordChecks = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasLetters: /[a-zA-Z]/.test(newPassword),
      hasNumbers: /[0-9]/.test(newPassword),
      matchesConfirm: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const canSubmitPassword =
    currentPassword.length > 0 &&
    passwordChecks.minLength &&
    passwordChecks.hasLetters &&
    passwordChecks.hasNumbers &&
    passwordChecks.matchesConfirm;

  // Handle Self-Service Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullName.trim()) {
      toast.error('Required Field', 'Full name is required.');
      return;
    }
    if (!profileEmail.trim()) {
      toast.error('Required Field', 'Email address is required.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileFullName.trim(),
          email: profileEmail.trim(),
          designation: profileDesignation.trim(),
          contactNo: profileContact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error('Update Failed', data.error || 'Failed to update profile.');
        return;
      }

      store.updateCurrentUser({
        fullName: profileFullName.trim(),
        email: profileEmail.trim(),
        designation: profileDesignation.trim(),
        contactNo: profileContact.trim(),
      });

      toast.success('Profile Updated', 'Your staff profile details have been saved.');
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    } catch (err: unknown) {
      toast.error('Error', err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Self-Service Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error('Password Update Failed', data.error || 'Current password may be incorrect.');
        return;
      }

      toast.success('Password Changed', 'Your account password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    } catch (err: unknown) {
      toast.error('Error', err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Deleting Staff User
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (
      userToDelete.id === currentUser.id ||
      userToDelete.email.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      toast.error('Operation Prohibited', 'You cannot delete your own active Super Admin account.');
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      const res = await fetch(
        `/api/auth/users?id=${encodeURIComponent(userToDelete.id)}&email=${encodeURIComponent(
          userToDelete.email
        )}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error('Delete Failed', data.error || 'Failed to remove staff account.');
        return;
      }

      store.deleteStaffUser(userToDelete.id);
      toast.success('Account Removed', `Staff account for ${userToDelete.fullName} has been removed.`);
      setUserToDelete(null);
    } catch (err: unknown) {
      toast.error('Error', err instanceof Error ? err.message : 'Network error occurred.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle Campus Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      schoolName,
      campusName,
      academicYear,
      dormitoryLeadName,
      dormitoryLeadContact,
      brevoApiKey: brevoApiKey.trim() || undefined,
      brevoSenderEmail: brevoSenderEmail.trim() || undefined,
      brevoSenderName: brevoSenderName.trim() || undefined,
    });

    setSaveFeedback(true);
    toast.success('Settings Saved', 'Campus configurations updated successfully.');
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleExportAuditLog = () => {
    const rows = activityLogs.map((log) => ({
      Timestamp: formatDateTime(log.createdAt),
      Action: log.action,
      Module: log.module,
      Detail: log.detail,
      Actor: log.actorName,
      IP: log.ipAddress || 'N/A',
    }));
    exportToCsv('dims_immutable_audit_trail', rows);
  };

  const handleTestBrevoEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);

    const res = await sendBrevoAnnouncement({
      title: 'DIMS Integration Verification Test',
      body: 'This is an automated operational test from your ASR Dormitory & Inventory Management System via Brevo API.',
      recipients: [
        {
          name: dormitoryLeadName || 'ASR Staff Lead',
          email: brevoSenderEmail || 'asr.dorm@school.edu.ph',
        },
      ],
      senderEmail: brevoSenderEmail,
      senderName: brevoSenderName,
      apiKey: brevoApiKey,
    });

    setIsTestingEmail(false);
    setTestEmailResult(res.details);
  };

  // Filter tabs based on role
  const visibleTabs = SETTINGS_TABS.filter((tab) => {
    if (tab.superAdminOnly && currentUser.role !== 'super_admin') {
      return false;
    }
    return true;
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Staff Profile & System Settings
            </h1>
            <Badge variant="neutral" size="sm">
              ASR Standalone Control
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Manage your personal profile, account password, staff user access roles, campus metadata, and email integrations
          </p>
        </div>

        {saveFeedback && (
          <div className="flex items-center gap-1.5 text-xs text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes updated successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E4E0] gap-4 overflow-x-auto pb-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#8C8C8A] hover:text-[#141414]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Staff Profile & Password */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Section 1: Personal Profile Details */}
          <form onSubmit={handleSaveProfile} className="minimal-card p-6 space-y-5">
            <div className="border-b border-[#E4E4E0] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#141414]">Personal Information & Designation</h3>
                <p className="text-xs text-[#8C8C8A]">
                  Update your contact details and campus designation. Updates automatically reflect in system logs and reports.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase bg-[#EEF2FF] text-[#4F46E5] font-semibold px-2.5 py-1 rounded-md border border-[#C7D2FE]">
                  Role: {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  className="input-minimal"
                  placeholder="e.g. Maria Joy Clemente"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                  Official Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input-minimal"
                  placeholder="name@school.edu.ph"
                />
                <p className="text-[11px] text-[#8C8C8A] mt-1">
                  Changing this email updates your active authentication login session.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                  Campus Title / Official Designation
                </label>
                <input
                  type="text"
                  value={profileDesignation}
                  onChange={(e) => setProfileDesignation(e.target.value)}
                  className="input-minimal"
                  placeholder="e.g. ASR Head Representative & Dorm Custodian"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="text"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="input-minimal"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E0] flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdatingProfile}
                className="flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>

          {/* Section 2: Password Change */}
          <form onSubmit={handleChangePassword} className="minimal-card p-6 space-y-5">
            <div className="border-b border-[#E4E4E0] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-sm font-bold text-[#141414]">Change Account Password</h3>
              </div>
              <p className="text-xs text-[#8C8C8A] mt-0.5">
                Verify your existing password before establishing new authentication credentials.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                  Current Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="input-minimal pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2.5 text-[#8C8C8A] hover:text-[#141414] cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                    New Password <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-minimal pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-[#8C8C8A] hover:text-[#141414] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                    Confirm New Password <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-minimal"
                  />
                </div>
              </div>

              {/* Password Requirements Card */}
              <div className="p-3.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] space-y-1.5 text-xs">
                <p className="font-semibold text-[#141414] text-[11px] uppercase tracking-wider">
                  Password Security Criteria:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordChecks.minLength ? 'text-[#16A34A] font-medium' : 'text-[#8C8C8A]'
                    }`}
                  >
                    {passwordChecks.minLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center leading-3">•</span>}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordChecks.hasLetters && passwordChecks.hasNumbers
                        ? 'text-[#16A34A] font-medium'
                        : 'text-[#8C8C8A]'
                    }`}
                  >
                    {passwordChecks.hasLetters && passwordChecks.hasNumbers ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 text-center leading-3">•</span>
                    )}
                    <span>Contains letters & numbers</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordChecks.matchesConfirm ? 'text-[#16A34A] font-medium' : 'text-[#8C8C8A]'
                    }`}
                  >
                    {passwordChecks.matchesConfirm ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 text-center leading-3">•</span>
                    )}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E0] flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmitPassword || isUpdatingPassword}
                className="flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Super Admin Staff User Management */}
      {activeTab === 'users' && currentUser.role === 'super_admin' && (
        <div className="minimal-card p-6 space-y-5">
          <div className="border-b border-[#E4E4E0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-sm font-bold text-[#141414]">Staff User Accounts & Access Roles</h3>
              </div>
              <p className="text-xs text-[#8C8C8A] mt-0.5">
                Super Admin credential provisioning, role-based access control (RBAC), and account suspensions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Badge variant="default" size="sm">
                {staffUsers.length} Staff Accounts
              </Badge>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Provision Staff Member
              </Button>
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold text-[#8C8C8A]">Staff Member</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#8C8C8A]">Designation</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#8C8C8A]">Access Role</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#8C8C8A]">Status</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#8C8C8A] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {staffUsers.map((staff) => {
                    const isSelf =
                      staff.id === currentUser.id ||
                      staff.email.toLowerCase() === currentUser.email.toLowerCase();

                    return (
                      <tr key={staff.id} className="hover:bg-[#F8F8F6] transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs uppercase border border-[#C7D2FE]">
                              {staff.fullName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#141414]">{staff.fullName}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-medium bg-[#F0FDF4] text-[#16A34A] px-1.5 py-0.2 rounded border border-[#BBF7D0]">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8C8C8A] font-mono">{staff.email}</p>
                              {staff.contactNo && (
                                <p className="text-[10px] text-[#555552]">{staff.contactNo}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-[#555552] font-medium">
                          {staff.designation}
                        </td>

                        <td className="py-3 px-3.5">
                          {staff.role === 'super_admin' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                              <ShieldCheck className="w-3 h-3" /> Super Admin
                            </span>
                          )}
                          {staff.role === 'dorm_manager' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                              Dorm Manager
                            </span>
                          )}
                          {staff.role === 'inventory_officer' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              Inventory Officer
                            </span>
                          )}
                          {staff.role === 'viewer' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F4F4F2] text-[#555552] border border-[#E4E4E0]">
                              Viewer
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <Badge variant={staff.isActive ? 'success' : 'neutral'} size="sm" dot>
                            {staff.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserToEdit(staff);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-md text-[#555552] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
                              title="Edit Role / Reset Password"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(staff)}
                                className="p-1.5 rounded-md text-[#8C8C8A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                title="Remove Staff Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Campus & System Info */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="minimal-card p-6 space-y-5">
          <div className="border-b border-[#E4E4E0] pb-3">
            <h3 className="text-sm font-bold text-[#141414]">Campus & Institution Details</h3>
            <p className="text-xs text-[#8C8C8A]">
              Shown on printable reports, official letters, and outgoing dormer notices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">School / Academy Name</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Campus / Complex Name</label>
              <input
                type="text"
                required
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Lead Staff Representative</label>
              <input
                type="text"
                required
                value={dormitoryLeadName}
                onChange={(e) => setDormitoryLeadName(e.target.value)}
                className="input-minimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Contact Hotline</label>
              <input
                type="text"
                value={dormitoryLeadContact}
                onChange={(e) => setDormitoryLeadContact(e.target.value)}
                className="input-minimal"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E4E0] flex justify-end">
            <Button type="submit" variant="primary" className="flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Campus Configurations
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Brevo Email Engine */}
      {activeTab === 'brevo' && (
        <form onSubmit={handleSaveSettings} className="minimal-card p-6 space-y-5">
          <div className="border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#141414]">Brevo (Sendinblue) Bulk Email Integration</h3>
                <p className="text-xs text-[#8C8C8A]">
                  Dispatches announcements and notices directly to registered students, employees, and visitors.
                </p>
              </div>
              <Badge variant={brevoApiKey ? 'success' : 'warning'} size="sm" dot>
                {brevoApiKey ? 'API Key Configured' : 'Simulation Fallback Active'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                Brevo API v3 Key (from app.brevo.com)
              </label>
              <input
                type="password"
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                placeholder="xkeysib-..."
                className="input-minimal font-mono"
              />
              <p className="text-[11px] text-[#8C8C8A] mt-1">
                Obtain your key from{' '}
                <a
                  href="https://app.brevo.com/settings/keys/api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4F46E5] hover:underline"
                >
                  Brevo Dashboard &rarr; SMTP & API
                </a>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Verified Sender Email</label>
                <input
                  type="email"
                  value={brevoSenderEmail}
                  onChange={(e) => setBrevoSenderEmail(e.target.value)}
                  placeholder="asr.dorm@school.edu.ph"
                  className="input-minimal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2A] mb-1">Sender Display Name</label>
                <input
                  type="text"
                  value={brevoSenderName}
                  onChange={(e) => setBrevoSenderName(e.target.value)}
                  placeholder="ASR Dormitory Representative"
                  className="input-minimal"
                />
              </div>
            </div>

            {testEmailResult && (
              <div className="p-3 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-xs text-[#2C2C2A]">
                <strong>Dispatch Output:</strong> {testEmailResult}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E4E4E0] flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isTestingEmail}
              onClick={handleTestBrevoEmail}
              className="flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Test Dispatch
            </Button>

            <Button type="submit" variant="primary" className="flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Brevo API Key
            </Button>
          </div>
        </form>
      )}

      {/* Tab 5: Supabase Cloud DB */}
      {activeTab === 'supabase' && (
        <div className="minimal-card p-6 space-y-5">
          <div className="border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#141414]">Supabase PostgreSQL Cloud Database</h3>
                <p className="text-xs text-[#8C8C8A]">
                  Cloud persistence with Row Level Security (RLS) policies for ASR Staff data.
                </p>
              </div>
              <Badge variant={settings.supabaseConnected ? 'success' : 'neutral'} size="sm" dot>
                {settings.supabaseConnected ? 'Cloud Connected' : 'Local Standalone Engine'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E4E4E0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#141414]">Connection Status</span>
                <Badge variant={settings.supabaseConnected ? 'success' : 'neutral'} size="sm" dot>
                  {settings.supabaseConnected ? 'Cloud Connected' : 'Offline / Not Configured'}
                </Badge>
              </div>
              <div className="space-y-2 text-xs text-[#555552]">
                <div className="flex justify-between items-center">
                  <span>Project URL</span>
                  <span className="font-mono text-[11px] text-[#8C8C8A]">
                    {settings.supabaseUrl ? settings.supabaseUrl.replace('https://', '').substring(0, 24) + '...' : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Public Anon Key</span>
                  <span className="font-mono text-[11px] text-[#8C8C8A]">
                    {settings.supabaseAnonKey ? '••••••••••••••••' + settings.supabaseAnonKey.slice(-6) : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>⚠</span> Cloud credentials are managed via Vercel Environment Variables
              </p>
              <p className="text-[11px] leading-relaxed">
                To configure or update Supabase credentials, navigate to your Vercel Project Dashboard &rarr; Settings &rarr; Environment Variables and update <code className="font-mono bg-white/70 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono bg-white/70 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then trigger a redeployment.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E4E4E0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#141414]">
                  PostgreSQL Schema & Security Policies (RLS)
                </span>
                <span className="text-[10px] font-mono text-[#8C8C8A]">supabase/schema.sql</span>
              </div>
              <p className="text-[11px] text-[#555552]">
                All database tables (rooms, bed_slots, dormers, inventory, stock_transactions, announcements, activity_logs, user_profiles) are fully defined in the repository file <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#E4E4E0]">supabase/schema.sql</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="minimal-card p-6 space-y-4">
          <div className="border-b border-[#E4E4E0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#141414]">Immutable Activity Audit Trail</h3>
              <p className="text-xs text-[#8C8C8A]">
                Cryptographically protected chronological log of all administrative actions in DIMS.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="default" size="sm">
                {activityLogs.length} Records
              </Badge>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportAuditLog}
                className="flex items-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit CSV
              </Button>
            </div>
          </div>

          <div className="border border-[#E4E4E0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Action</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Module</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A]">Details</th>
                    <th className="py-2.5 px-3 font-semibold text-[#8C8C8A] text-right">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#8C8C8A]">
                        No activity records logged yet.
                      </td>
                    </tr>
                  ) : (
                    activityLogs
                      .slice((auditPage - 1) * AUDIT_PER_PAGE, auditPage * AUDIT_PER_PAGE)
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-[#F8F8F6]">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#8C8C8A] whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4F46E5] px-1.5 py-0.5 rounded">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-[#555552]">
                            {log.module}
                          </td>
                          <td className="py-2.5 px-3 text-[#2C2C2A]">{log.detail}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#141414] whitespace-nowrap">
                            {log.actorName}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {activityLogs.length > AUDIT_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#8C8C8A]">
                Showing {(auditPage - 1) * AUDIT_PER_PAGE + 1}–
                {Math.min(auditPage * AUDIT_PER_PAGE, activityLogs.length)} of {activityLogs.length} entries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={auditPage === 1}
                  onClick={() => setAuditPage((p) => p - 1)}
                  className="text-xs"
                >
                  &larr; Prev
                </Button>
                <span className="text-xs font-medium text-[#555552] px-1">
                  Page {auditPage} of {Math.ceil(activityLogs.length / AUDIT_PER_PAGE)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={auditPage >= Math.ceil(activityLogs.length / AUDIT_PER_PAGE)}
                  onClick={() => setAuditPage((p) => p + 1)}
                  className="text-xs"
                >
                  Next &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Provisioning / Edit Modal */}
      <StaffUserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUserToEdit(null);
        }}
        userToEdit={selectedUserToEdit}
        onSaved={() => {
          setStaffUsers(store.getStaffUsers());
        }}
      />

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E4E4E0] shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <Trash2 className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[#141414]">Remove Staff Account</h4>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-[#8C8C8A] hover:text-[#141414]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#555552] leading-relaxed">
              Are you sure you want to permanently remove access for{' '}
              <strong className="text-[#141414]">{userToDelete.fullName}</strong> ({userToDelete.email})?
              This will revoke login credentials immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
              >
                {isDeletingUser ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-center text-xs text-[#8C8C8A]">
            Loading settings configurations...
          </div>
        </AppShell>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
