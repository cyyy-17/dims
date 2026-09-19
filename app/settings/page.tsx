'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { AppSettings, ActivityLog } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { sendBrevoAnnouncement } from '@/lib/brevo';
import {
  Mail,
  Database,
  Building2,
  Clock,
  Save,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

type SettingsTabId = 'system' | 'brevo' | 'supabase' | 'audit';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_TABS: SettingsTab[] = [
  { id: 'system', label: '1. Campus & System Info', icon: Building2 },
  { id: 'brevo', label: '2. Brevo Email Engine', icon: Mail },
  { id: 'supabase', label: '3. Supabase Cloud DB', icon: Database },
  { id: 'audit', label: '4. Immutable Audit Trail', icon: Clock },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(store.getSettings());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(store.getActivityLogs());
  const [activeTab, setActiveTab] = useState<SettingsTabId>('system');

  // Form states
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

  // Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');

  // Save feedback
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSettings(store.getSettings());
      setActivityLogs(store.getActivityLogs());
    });
    return unsub;
  }, []);

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
      supabaseUrl: supabaseUrl.trim() || undefined,
      supabaseAnonKey: supabaseAnonKey.trim() || undefined,
    });

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleTestBrevoEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);

    const res = await sendBrevoAnnouncement({
      title: 'DIMS Integration Verification Test',
      body:
        'This is an automated operational test from your ASR Dormitory & Inventory Management System via Brevo API.',
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

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              System Settings & Cloud Integrations
            </h1>
            <Badge variant="neutral" size="sm">
              ASR Standalone Control
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Configure campus details, Brevo bulk email service, Supabase PostgreSQL credentials, and view immutable audit trails
          </p>
        </div>

        {saveFeedback && (
          <div className="flex items-center gap-1.5 text-xs text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E4E0] gap-4 overflow-x-auto pb-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 text-xs font-semibold border-b-2 transition-all shrink-0 ${
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

      {/* Tab 1: Campus & System Info */}
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

      {/* Tab 2: Brevo Email Engine */}
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

      {/* Tab 3: Supabase Cloud DB */}
      {activeTab === 'supabase' && (
        <form onSubmit={handleSaveSettings} className="minimal-card p-6 space-y-5">
          <div className="border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#141414]">Supabase PostgreSQL Cloud Database</h3>
                <p className="text-xs text-[#8C8C8A]">
                  Cloud persistence with Row Level Security (RLS) policies for ASR Staff data.
                </p>
              </div>
              <Badge variant={supabaseUrl ? 'success' : 'neutral'} size="sm" dot>
                {supabaseUrl ? 'Cloud Connected' : 'Local Standalone Engine'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className="input-minimal font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2C2A] mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="input-minimal font-mono"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E4E4E0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#141414]">
                  PostgreSQL Schema & Security Policies (RLS)
                </span>
                <span className="text-[10px] font-mono text-[#8C8C8A]">supabase/schema.sql</span>
              </div>
              <p className="text-[11px] text-[#555552]">
                All database tables (rooms, bed_slots, dormers, inventory, stock_transactions, announcements, activity_logs) are fully defined in the repository file <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#E4E4E0]">supabase/schema.sql</code>.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E4E0] flex justify-end">
            <Button type="submit" variant="primary" className="flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Supabase Cloud Credentials
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="minimal-card p-6 space-y-4">
          <div className="border-b border-[#E4E4E0] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#141414]">Immutable Activity Audit Trail</h3>
              <p className="text-xs text-[#8C8C8A]">
                Cryptographically protected chronological log of all administrative actions in DIMS.
              </p>
            </div>
            <Badge variant="default" size="sm">
              {activityLogs.length} Records
            </Badge>
          </div>

          <div className="border border-[#E4E4E0] rounded-xl overflow-hidden max-h-96 overflow-y-auto">
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
                {activityLogs.map((log) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
