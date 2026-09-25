import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import {
  LayoutDashboard,
  Scale,
  FileText,
  CalendarCheck,
  CheckCircle2,
  Award,
  Sliders,
  History,
  CloudOff,
  RefreshCw,
  Smartphone,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuthStore();
  const { queue, syncQueue, isSyncing } = useOfflineQueueStore();

  const role = user?.role || 'BUSINESS_USER';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['BUSINESS_USER', 'LMO', 'GATC', 'ADMIN', 'SUPERVISOR'] },
    
    // Business User
    { id: 'instruments', label: 'My Instruments', icon: Scale, roles: ['BUSINESS_USER'] },
    { id: 'passport', label: 'Digital Passport', icon: Smartphone, roles: ['BUSINESS_USER', 'LMO', 'ADMIN'] },
    { id: 'applications', label: 'Verification Applications', icon: FileText, roles: ['BUSINESS_USER'] },

    // LMO Officer
    { id: 'lmo-applications', label: 'Application Queue', icon: FileText, roles: ['LMO', 'SUPERVISOR'] },
    { id: 'assignments', label: 'Field Assignments', icon: CalendarCheck, roles: ['LMO', 'ADMIN', 'SUPERVISOR'] },
    { id: 'verifications', label: 'Verification Decisions', icon: CheckCircle2, roles: ['LMO', 'SUPERVISOR'] },
    { id: 'certificates', label: 'Issued Certificates', icon: Award, roles: ['LMO', 'ADMIN', 'SUPERVISOR'] },

    // GATC Field Officer
    { id: 'field-tasks', label: 'Assigned Inspections', icon: CalendarCheck, roles: ['GATC'] },
    { id: 'field-verify', label: 'Field Verification Form', icon: Smartphone, roles: ['GATC'] },

    // Admin & Supervisor
    { id: 'admin-instruments', label: 'National Registry', icon: Scale, roles: ['ADMIN'] },
    { id: 'rules', label: 'Regulatory Rule Engine', icon: Sliders, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'audit', label: 'Audit Trail & Compliance', icon: History, roles: ['ADMIN', 'SUPERVISOR'] },
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(role));

  const handleSync = async () => {
    const res = await syncQueue();
    alert(`Offline Sync Complete: ${res.successCount} evidence item(s) synced.`);
  };

  return (
    <aside className="w-64 bg-[#0d1527] border-r border-[#1a2745] flex flex-col justify-between hidden md:flex shrink-0">
      <div className="py-4">
        {/* Role Badge Indicator */}
        <div className="px-4 mb-4">
          <div className="bg-[#111c35] border border-[#1a2745] rounded-md p-2.5 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Portal View</p>
              <p className="text-xs font-bold text-white truncate">
                {role === 'BUSINESS_USER' && 'Business Owner Portal'}
                {role === 'LMO' && 'LMO Officer Portal'}
                {role === 'GATC' && 'Field Officer Mobile Portal'}
                {role === 'ADMIN' && 'National System Admin'}
                {role === 'SUPERVISOR' && 'Zonal Supervisor'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 px-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#162344]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Offline Queue Status (Crucial for field resilience demo) */}
      <div className="p-4 border-t border-[#1a2745] space-y-3">
        {queue.length > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 font-bold">
                <CloudOff className="w-3.5 h-3.5" /> Offline Queue
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono font-bold">
                {queue.length}
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80 mb-2">Pending evidence captures waiting for network sync.</p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Evidence Now'}
            </button>
          </div>
        ) : (
          <div className="bg-[#111c35] border border-[#1a2745] rounded-lg p-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Offline Queue Clear</span>
            </span>
            <span className="text-[10px] text-slate-500">0 queued</span>
          </div>
        )}

        {/* Claim Boundary & Prototype Note */}
        <div className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-tight">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
          <span>INSPECTRA prototype demo for SIH-26036. Non-statutory sandbox environment.</span>
        </div>
      </div>
    </aside>
  );
};
