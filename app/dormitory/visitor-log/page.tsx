'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { store } from '@/lib/data-store';
import { VisitorLog } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VisitorLogModal } from '@/components/dormitory/VisitorLogModal';
import { exportToCsv } from '@/lib/csv';
import {
  Plus,
  Download,
  Search,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function VisitorLogPage() {
  const [logs, setLogs] = useState<VisitorLog[]>(store.getVisitorLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setLogs(store.getVisitorLogs());
    });
    return unsub;
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.visitorName.toLowerCase().includes(q) ||
      l.purpose.toLowerCase().includes(q) ||
      (l.dormerVisitedName && l.dormerVisitedName.toLowerCase().includes(q))
    );
  });

  const handleMarkTimeOut = (logId: string) => {
    store.markVisitorTimeOut(logId);
  };

  const handleExportCsv = () => {
    const rows = filteredLogs.map((l) => ({
      Visitor_Name: l.visitorName,
      Contact: l.contact || 'N/A',
      Purpose: l.purpose,
      Dormer_Visited: l.dormerVisitedName || 'Campus General',
      Time_In: formatDateTime(l.timeIn),
      Time_Out: l.timeOut ? formatDateTime(l.timeOut) : 'Still Inside',
      Security_Notes: l.notes || '',
      Logged_By: l.loggedBy,
    }));
    exportToCsv('dims_visitor_entry_log', rows);
  };

  const activeVisitorsInside = logs.filter((l) => !l.timeOut).length;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
              Campus Visitor Log & Security Register
            </h1>
            <Badge variant={activeVisitorsInside > 0 ? 'warning' : 'success'} size="sm" dot>
              {activeVisitorsInside} Currently On Premises
            </Badge>
          </div>
          <p className="text-xs text-[#8C8C8A] mt-1">
            Log of external guests, family members, accreditation visitors, and contractors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Visitor Entry
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E4E0]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8C8A] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by visitor name, purpose, or resident visited..."
            className="input-minimal !pl-10"
          />
        </div>

        <span className="text-xs text-[#8C8C8A]">
          {filteredLogs.length} total entries recorded
        </span>
      </div>

      {/* Visitor Log Table */}
      <div className="minimal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAF9] border-b border-[#E4E4E0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Visitor Identity
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Purpose of Visit
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Host Dormer
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Time In & Out
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Security Status
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {filteredLogs.map((log) => {
                const isStillInside = !log.timeOut;

                return (
                  <tr key={log.id} className="hover:bg-[#F8F8F6] transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-[#141414] text-sm">{log.visitorName}</p>
                        <p className="text-[11px] text-[#8C8C8A] mt-0.5">{log.contact || 'No phone provided'}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-[#2C2C2A]">{log.purpose}</p>
                      {log.notes && <p className="text-[10px] text-[#8C8C8A] mt-0.5">{log.notes}</p>}
                    </td>

                    <td className="py-3 px-4">
                      {log.dormerVisitedName ? (
                        <div className="flex items-center gap-1.5 font-medium text-[#4F46E5]">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{log.dormerVisitedName}</span>
                        </div>
                      ) : (
                        <span className="text-[#8C8C8A] italic">General Facility Visit</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>
                        <span className="text-[#16A34A] font-semibold">IN:</span> {formatDateTime(log.timeIn)}
                      </div>
                      <div>
                        <span className="text-[#8C8C8A] font-semibold">OUT:</span>{' '}
                        {log.timeOut ? formatDateTime(log.timeOut) : '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isStillInside ? (
                        <Badge variant="warning" size="sm" dot>
                          Inside Premises
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Completed Exit
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isStillInside ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMarkTimeOut(log.id)}
                          className="text-xs h-7 gap-1 text-[#16A34A] border-[#BBF7D0] hover:bg-[#F0FDF4]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Exit
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#8C8C8A]">Exited</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-[#8C8C8A]">
                    No visitor entries match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VisitorLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AppShell>
  );
}
