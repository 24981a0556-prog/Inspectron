import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';
import {
  Scale,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  ArrowRight,
  ShieldCheck,
  Building,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'BUSINESS_USER';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let endpoint = '/dashboard/business';
        if (role === 'LMO' || role === 'SUPERVISOR') endpoint = '/dashboard/lmo';
        if (role === 'ADMIN') endpoint = '/dashboard/admin';

        const res = await apiClient.get(endpoint);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [role]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527] border border-[#1a2745] p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white font-mono">
              {role === 'BUSINESS_USER' && 'Business Compliance & Instrument Overview'}
              {role === 'LMO' && 'Legal Metrology Officer Verification Command'}
              {role === 'GATC' && 'Field Verification & Mobile Testing Hub'}
              {role === 'ADMIN' && 'National Legal Metrology Intelligence Dashboard'}
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Demo Seed Data
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {role === 'BUSINESS_USER' && 'Manage your weighing instruments, track verification validity, and submit statutory applications.'}
            {role === 'LMO' && 'Review incoming applications, assign authorized field officers, inspect test evidence, and issue digital certificates.'}
            {role === 'GATC' && 'Conduct field inspections with offline-resilient evidence capture and instant regulatory rule evaluation.'}
            {role === 'ADMIN' && 'Monitor nationwide instrument compliance, regulatory rule versions, and verifiable audit trails.'}
          </p>
        </div>

        {/* Quick Golden Path Action Button */}
        <div className="flex items-center gap-3">
          {role === 'BUSINESS_USER' && (
            <button
              onClick={() => onNavigate('passport')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Digital Passport</span>
            </button>
          )}

          {role === 'LMO' && (
            <button
              onClick={() => onNavigate('lmo-applications')}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Review Applications Queue</span>
            </button>
          )}

          {role === 'GATC' && (
            <button
              onClick={() => onNavigate('field-verify')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Start Field Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'BUSINESS_USER' && (
          <>
            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Total Instruments</span>
                <Scale className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.total_instruments || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Apex Instruments EW-30</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Active Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">ACTIVE</p>
              <p className="text-[11px] text-slate-500 mt-1">Ready for verification demo</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Applications in Flight</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.pending_applications || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Application VER-2026-00128</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Organization</span>
                <Building className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-white truncate">ABC Retail Store</p>
              <p className="text-[11px] text-slate-500 mt-1">Visakhapatnam, Andhra Pradesh</p>
            </div>
          </>
        )}

        {(role === 'LMO' || role === 'SUPERVISOR') && (
          <>
            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Pending Review</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400 font-mono">{stats?.pending_review_count || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting scheduling & assignment</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Field Inspections</span>
                <Smartphone className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.active_assignments_count || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">GATC Officers Dispatched</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Awaiting Authorization</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-cyan-400 font-mono">{stats?.awaiting_authorization_count || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Rule validated field results</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Certificates Issued</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.certificates_issued_count || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">QR verifiable digital certs</p>
            </div>
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Registered Instruments</span>
                <Scale className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.total_instruments || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">All categories in registry</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Organizations</span>
                <Building className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.total_organizations || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Retailers, manufacturers, labs</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Regulatory Rules</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">6 ACTIVE</p>
              <p className="text-[11px] text-slate-500 mt-1">Electronic Weighing v1.0</p>
            </div>

            <div className="bg-[#0d1527] border border-[#1a2745] p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">System Users</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{stats?.total_users || 4}</p>
              <p className="text-[11px] text-slate-500 mt-1">Across 5 RBAC roles</p>
            </div>
          </>
        )}
      </div>

      {/* Golden Path Guided Step Card */}
      <div className="bg-[#0d1527] border border-[#1a2745] p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1a2745]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              SIH 2026 Golden Path Lifecycle Progress
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status across the single demonstration instrument: Apex Instruments EW-30 (Serial AP-EW-2026-00128)
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
            Pass ID: INST-AP-00128
          </span>
        </div>

        {/* 6-Stage Visual Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
          {[
            { step: '1', title: 'Register Scale', sub: 'Apex EW-30', done: true },
            { step: '2', title: 'Application', sub: 'VER-2026-00128', done: true },
            { step: '3', title: 'LMO Review', sub: 'Assign Officer', done: false, active: true },
            { step: '4', title: 'Field Testing', sub: 'Rules Validation', done: false },
            { step: '5', title: 'Authorized Decision', sub: 'Statutory Approval', done: false },
            { step: '6', title: 'QR Certificate', sub: 'Public Verify', done: false }
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center transition-all ${
                s.done
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : s.active
                  ? 'bg-blue-950/30 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-[#111c35]/40 border-[#1a2745] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  s.done ? 'bg-emerald-500 text-black' : s.active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {s.step}
                </span>
              </div>
              <p className="text-xs font-bold truncate">{s.title}</p>
              <p className="text-[10px] opacity-75 truncate">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Current active stage: <b>LMO Review & Assignment</b> (Ready for officer scheduling)</span>
          <button
            onClick={() => onNavigate(role === 'BUSINESS_USER' ? 'passport' : 'lmo-applications')}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Proceed with Golden Path</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
