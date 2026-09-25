import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import { Shield, Sparkles, User as UserIcon, LogOut, ChevronDown, Check } from 'lucide-react';

interface NavbarProps {
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, logout, quickLogin, isLoading } = useAuthStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'BUSINESS_USER', label: 'Business User', desc: 'ABC Retail Store (Ramesh Varma)', color: 'border-l-blue-500' },
    { role: 'LMO', label: 'LMO Officer', desc: 'Legal Metrology Officer (Rajesh Kumar)', color: 'border-l-cyan-400' },
    { role: 'GATC', label: 'Field Officer', desc: 'GATC Inspection (Suresh Naidu)', color: 'border-l-emerald-500' },
    { role: 'ADMIN', label: 'System Admin', desc: 'National Registry & Rule Engine', color: 'border-l-amber-500' }
  ];

  const handleRoleSelect = async (role: UserRole) => {
    setRoleMenuOpen(false);
    await quickLogin(role);
    if (onNavigate) onNavigate('dashboard');
  };

  return (
    <header className="h-16 bg-[#0d1527] border-b border-[#1a2745] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      {/* Brand & GovTech Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-lg text-white font-mono">INSPECTRA</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              SIH-26036
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Legal Metrology Online Verification & Digital Passport</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Role Switcher (SIH Presentation Supercharger!) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111c35] hover:bg-[#1a2745] border border-[#233458] text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 hidden md:inline">Demo Switch:</span>
            <span className="font-bold text-white">
              {roles.find(r => r.role === user?.role)?.label || user?.role || 'Switch Role'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d1527] border border-[#233458] rounded-lg shadow-xl shadow-black/60 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 border-b border-[#1a2745] mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SIH Demo Persona Switcher</p>
                <p className="text-[10px] text-slate-500">Switch instantaneously between end-to-end actors</p>
              </div>
              {roles.map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#162344] transition-colors border-l-4 ${item.color} ${user?.role === item.role ? 'bg-blue-600/10' : ''}`}
                >
                  <div>
                    <p className={`font-bold ${user?.role === item.role ? 'text-blue-400' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  {user?.role === item.role && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Card & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#1a2745]">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">{user.full_name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-md hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
