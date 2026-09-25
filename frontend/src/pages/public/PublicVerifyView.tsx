import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { PublicVerificationResponse } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Scale,
  Building,
  Calendar,
  Award,
  ArrowLeft,
  QrCode,
  ShieldAlert
} from 'lucide-react';

interface PublicVerifyViewProps {
  token: string;
  onBackToApp?: () => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({ token, onBackToApp }) => {
  const [data, setData] = useState<PublicVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/public/verify/${token}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'This certificate could not be verified or has been revoked.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#1a2745]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-white font-mono">INSPECTRA</span>
          <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">Public QR Verification</span>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Application</span>
          </button>
        )}
      </header>

      {/* Main Verification Card */}
      <main className="max-w-2xl w-full mx-auto my-8 space-y-6">
        {loading ? (
          <div className="bg-[#0d1527] border border-[#1a2745] rounded-2xl p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Verifying certificate cryptographic QR token...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-[#0d1527] border border-red-500/40 rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Certificate Verification Failed</h2>
              <p className="text-xs text-red-300/80 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <div className="p-3 bg-[#111c35] rounded-lg text-[11px] text-slate-400 font-mono">
              Token: {token}
            </div>
          </div>
        ) : (
          <div className="bg-[#0d1527] border-2 border-[#1a2745] rounded-2xl overflow-hidden shadow-2xl space-y-6">
            {/* Authenticity Banner */}
            <div className="bg-emerald-950/40 border-b border-emerald-500/30 p-6 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                AUTHENTIC VERIFIED INSTRUMENT
              </h2>
              <p className="text-xs text-emerald-400 font-semibold">
                Government of Legal Metrology · Digital Compliance Record Active
              </p>
              <div className="inline-block mt-1 px-3 py-1 rounded bg-[#0a0f1e] text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                Certificate No: {data.certificate_number}
              </div>
            </div>

            {/* Verified Details */}
            <div className="px-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-400" /> Instrument Specifications
                  </span>
                  <p className="text-xs font-bold text-white mt-1">{data.instrument.manufacturer} {data.instrument.model}</p>
                  <p className="text-[11px] text-slate-300 font-mono">Serial: {data.instrument.serial_number}</p>
                  <p className="text-[11px] text-slate-400">Verified Capacity: <b>{data.instrument.capacity} {data.instrument.capacity_unit}</b></p>
                </div>

                <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-cyan-400" /> Verified Merchant & Site
                  </span>
                  <p className="text-xs font-bold text-white mt-1">{data.owner.name}</p>
                  <p className="text-[11px] text-slate-300">{data.owner.city}, {data.owner.state}</p>
                  <p className="text-[11px] text-slate-400">Location: {data.instrument.location_description || 'Counter 02'}</p>
                </div>

                <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Statutory Validity
                  </span>
                  <p className="text-xs font-bold text-white mt-1">From: {data.valid_from}</p>
                  <p className="text-xs font-bold text-emerald-400">Valid Until: {data.valid_until}</p>
                  <p className="text-[10px] text-slate-400">Status: <b className="text-emerald-400">{data.status}</b></p>
                </div>

                <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Verifying Officer
                  </span>
                  <p className="text-xs font-bold text-white mt-1">{data.issued_by}</p>
                  <p className="text-[11px] text-slate-400">Legal Metrology Officer</p>
                  <p className="text-[10px] text-slate-500 font-mono">Issued: {data.issued_at}</p>
                </div>
              </div>
            </div>

            {/* Cryptographic Footprint */}
            <div className="p-4 mx-6 bg-[#111c35] border border-[#233458] rounded-xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Verification URL</span>
              <p className="text-xs font-mono text-blue-400 break-all">{data.verification_url}</p>
            </div>

            {/* Statutory Disclaimer */}
            <div className="p-4 bg-[#0a0f1e] border-t border-[#1a2745] text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-slate-500" />
              <span>{data.disclaimer}</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 border-t border-[#1a2745]">
        INSPECTRA · Smart India Hackathon SIH-26036 Prototype Demonstration
      </footer>
    </div>
  );
};
