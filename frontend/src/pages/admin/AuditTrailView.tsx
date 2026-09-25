import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AuditLog } from '../../types';
import { History, Shield, Filter, Search, Terminal } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const url = filterType ? `/audit/?entity_type=${filterType}` : '/audit/';
        const res = await apiClient.get(url);
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filterType]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2745]">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Immutable Audit Trail & Regulatory Compliance Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically Traceable Lifecycle Record of Every State Transition (SIH-26036)
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#111c35] border border-[#233458] rounded-md p-1.5 text-xs text-slate-200"
          >
            <option value="">All Entity Events</option>
            <option value="INSTRUMENT">Instruments</option>
            <option value="APPLICATION">Applications</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="VERIFICATION">Verifications</option>
            <option value="EVIDENCE">Evidence</option>
            <option value="CERTIFICATE">Certificates</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0d1527] border border-[#1a2745] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#111c35] text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Actor Role</th>
                <th className="p-3">Details Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2745]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#111c35]/50 transition-colors">
                  <td className="p-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20 font-bold">
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white font-mono">{log.action}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                      {log.actor_role || 'SYSTEM'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
