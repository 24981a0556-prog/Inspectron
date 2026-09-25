import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import { Shield, Sparkles, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('business@abcretail.demo');
  const [password, setPassword] = useState('Business@1234');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleQuick = async (role: UserRole) => {
    await quickLogin(role);
  };

  const demoAccounts: { role: UserRole; title: string; subtitle: string; email: string; badge: string; color: string }[] = [
    {
      role: 'BUSINESS_USER',
      title: 'Business / Retailer',
      subtitle: 'ABC Retail Store, Visakhapatnam',
      email: 'business@abcretail.demo',
      badge: 'Step 1: Apply',
      color: 'border-blue-500/40 bg-blue-950/20 hover:border-blue-500'
    },
    {
      role: 'LMO',
      title: 'Legal Metrology Officer',
      subtitle: 'Rajesh Kumar (Review & Authorize)',
      email: 'lmo.rajesh@legal.demo',
      badge: 'Step 2: Assign & Authorize',
      color: 'border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-500'
    },
    {
      role: 'GATC',
      title: 'Field Verification Officer',
      subtitle: 'Suresh Naidu (Mobile Inspection)',
      email: 'officer@gatc.demo',
      badge: 'Step 3: Field Testing',
      color: 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500'
    },
    {
      role: 'ADMIN',
      title: 'National Administrator',
      subtitle: 'Registry, Rules & Audit Trail',
      email: 'admin@inspectra.demo',
      badge: 'System Governance',
      color: 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Subtle Accent Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a2745_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Smart India Hackathon 2026 · Problem SIH-26036
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            INSPECTRA
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Evidence-Driven Digital Verification & Lifecycle Intelligence for Legal Metrology Instruments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quick Demo Launchers (SIH Judge Presentation Optimized) */}
          <div className="lg:col-span-7 bg-[#0d1527] border border-[#1a2745] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2745]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quick Demo Launchpad</h2>
              </div>
              <span className="text-[11px] text-slate-400">1-Click Live Switch</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience the end-to-end golden path across all statutory roles without manually entering credentials:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleQuick(acc.role)}
                  disabled={isLoading}
                  className={`text-left p-3.5 rounded-lg border transition-all duration-200 group relative flex flex-col justify-between ${acc.color}`}
                >
                  <div className="space-y-1">
                    <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white/10 text-white mb-1">
                      {acc.badge}
                    </span>
                    <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {acc.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{acc.subtitle}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-400">
                    <span>Launch Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 text-[11px] text-slate-500 border-t border-[#1a2745] flex items-center justify-between">
              <span>Seed Scale: Apex Instruments EW-30 (30 kg)</span>
              <span>Visakhapatnam, AP</span>
            </div>
          </div>

          {/* Standard Login Form */}
          <div className="lg:col-span-5 bg-[#0d1527] border border-[#1a2745] rounded-xl p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Manual Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter registered legal metrology credentials</p>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111c35] border border-[#233458] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="officer@legal.demo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111c35] border border-[#233458] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Verifying...' : 'Sign In to INSPECTRA'}
              </button>
            </form>

            <div className="pt-3 text-center border-t border-[#1a2745]">
              <span className="text-[10px] text-slate-500 font-mono">
                RBAC Boundary Protected · 8h Session Token
              </span>
            </div>
          </div>
        </div>

        {/* Claim Boundary Disclaimer */}
        <p className="text-center text-[11px] text-slate-500 max-w-2xl mx-auto">
          Notice: This prototype demonstration is designed for Smart India Hackathon SIH-26036.
          All tolerance rules, instrument data, and certificate numbers are seeded sandbox demonstration records.
        </p>
      </div>
    </div>
  );
};
