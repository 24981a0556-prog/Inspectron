import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { InstrumentPassport } from '../../types';
import {
  Smartphone,
  Scale,
  Building,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  FileText,
  Shield,
  ArrowRight,
  Printer,
  QrCode,
  AlertCircle
} from 'lucide-react';

interface DigitalPassportViewProps {
  onNavigateToApply?: () => void;
  onViewCertificate?: (certId: string) => void;
}

export const DigitalPassportView: React.FC<DigitalPassportViewProps> = ({
  onNavigateToApply,
  onViewCertificate
}) => {
  const [passport, setPassport] = useState<InstrumentPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPassport = async () => {
      setLoading(true);
      try {
        // Fetch all instruments first to get ID
        const res = await apiClient.get('/instruments/');
        if (res.data && res.data.length > 0) {
          const instId = res.data[0].id;
          const passRes = await apiClient.get(`/instruments/${instId}/passport`);
          setPassport(passRes.data);
        } else {
          setError('No instruments registered in this organization.');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load Digital Instrument Passport');
      } finally {
        setLoading(false);
      }
    };
    fetchPassport();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono">Retrieving Digital Instrument Passport records...</p>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="p-8 bg-[#0d1527] border border-red-500/30 rounded-xl text-center space-y-3 text-red-400">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="text-sm font-bold">{error || 'Passport Not Found'}</p>
      </div>
    );
  }

  const isVerified = passport.status === 'VERIFIED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1a2745]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-400" />
              Digital Instrument Passport
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {passport.passport_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Single Source of Regulatory Truth · Legal Metrology Act Compliance Identity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded bg-[#111c35] hover:bg-[#1a2745] border border-[#233458] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Passport</span>
          </button>

          {passport.current_certificate && (
            <button
              onClick={() => onViewCertificate && onViewCertificate(passport.current_certificate!.id)}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Active Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Hardware Passport Card */}
      <div className="bg-[#0d1527] border-2 border-[#1a2745] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Certificate / Status Header Strip */}
        <div className={`p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 ${
          isVerified ? 'bg-emerald-950/40 border-b border-emerald-500/30' : 'bg-blue-950/40 border-b border-blue-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isVerified ? 'bg-emerald-500 text-black' : 'bg-blue-600 text-white'
            }`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statutory Regulatory Status</p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-extrabold ${isVerified ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {passport.status}
                </span>
                <span className="text-xs text-slate-400">· Electronic Weighing Instrument</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase">Serial Number</p>
              <p className="font-mono font-bold text-white">{passport.serial_number}</p>
            </div>
            <div className="text-right pl-4 border-l border-white/10">
              <p className="text-[10px] text-slate-400 uppercase">Capacity</p>
              <p className="font-mono font-bold text-white">{passport.capacity} {passport.capacity_unit}</p>
            </div>
          </div>
        </div>

        {/* Passport Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Identity Parameters (Left 8 Cols) */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" /> Instrument Identity & Technical Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Manufacturer</span>
                  <p className="text-xs font-bold text-white mt-0.5">{passport.manufacturer}</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Model Code</span>
                  <p className="text-xs font-bold text-white mt-0.5">{passport.model}</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Manufacture Year</span>
                  <p className="text-xs font-bold text-white mt-0.5">{passport.manufacture_year || 2024}</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Purchase Date</span>
                  <p className="text-xs font-bold text-white mt-0.5">{passport.purchase_date || '2024-03-15'}</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Capacity Rating</span>
                  <p className="text-xs font-bold text-white mt-0.5">{passport.capacity} {passport.capacity_unit}</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase">Category</span>
                  <p className="text-xs font-bold text-white mt-0.5">Non-Automatic Weighing</p>
                </div>
              </div>
            </div>

            {/* Premise & Owner */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" /> Deploying Business & Installation Site
              </h2>
              <div className="bg-[#111c35] p-4 rounded-lg border border-[#1a2745] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{passport.organization?.name || 'ABC Retail Store'}</span>
                  <span className="text-[10px] font-mono text-slate-400">GSTIN: {passport.organization?.gstin || '37AAAAA0000A1Z5'}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {passport.organization?.address || 'Shop 14, Commercial Complex, Daba Gardens'}, {passport.organization?.city || 'Visakhapatnam'}, {passport.organization?.state || 'Andhra Pradesh'}
                </p>
                <div className="pt-2 border-t border-[#1a2745] flex items-center justify-between text-xs text-slate-400">
                  <span>Physical Location: <b>{passport.location_description || 'Counter 02 - Billing Section'}</b></span>
                  <span>Contact: {passport.organization?.contact_email || 'contact@abcretail.demo'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Passport Visual Widget (Right 4 Cols) */}
          <div className="md:col-span-4 bg-[#111c35] border border-[#233458] rounded-xl p-5 flex flex-col items-center justify-between text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Instrument QR Identity</span>
              <p className="text-xs font-bold text-white font-mono">{passport.passport_id}</p>
            </div>

            {/* Simulated High-Res QR display */}
            <div className="w-40 h-40 bg-white p-3 rounded-lg shadow-inner flex flex-col items-center justify-center">
              <div className="w-full h-full border-2 border-dashed border-slate-300 flex items-center justify-center flex-col text-slate-900">
                <QrCode className="w-24 h-24 text-slate-950" />
                <span className="text-[8px] font-mono font-bold mt-1 text-slate-700">INSPECTRA PASSPORT</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[11px] font-semibold text-slate-300">Fast Field Verification Scan</p>
              <p className="text-[10px] text-slate-400">
                LMOs and GATC officers scan this QR on-site to immediately load verification checklist and history.
              </p>
            </div>

            {passport.current_certificate && (
              <div className="w-full pt-2 border-t border-[#1a2745] text-[11px] text-emerald-400 font-mono font-bold">
                Cert: {passport.current_certificate.certificate_number}
              </div>
            )}
          </div>
        </div>

        {/* Verification & Lifecycle History Timeline */}
        <div className="p-6 bg-[#0a0f1e]/60 border-t border-[#1a2745] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Verification Lifecycle & Application History
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {passport.recent_applications.length} Application(s) Recorded
            </span>
          </div>

          <div className="space-y-2.5">
            {passport.recent_applications.map((app) => (
              <div
                key={app.id}
                className="bg-[#111c35] border border-[#1a2745] p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold font-mono">
                    VER
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{app.application_number}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{app.application_type} Statutory Verification</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <div className="text-right">
                    <span className="text-[10px] uppercase block">Submitted</span>
                    <span className="text-[11px] text-slate-200">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                  {app.authorized_at && (
                    <div className="text-right pl-4 border-l border-[#1a2745]">
                      <span className="text-[10px] uppercase text-emerald-400 block">Authorized</span>
                      <span className="text-[11px] text-emerald-300">
                        {new Date(app.authorized_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
