import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Certificate } from '../../types';
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Calendar,
  Building,
  Scale,
  X
} from 'lucide-react';

interface CertificateViewerModalProps {
  certificateId: string;
  onClose: () => void;
  onNavigateToPublicVerify?: (token: string) => void;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  certificateId,
  onClose,
  onNavigateToPublicVerify
}) => {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/certificates/${certificateId}`);
        setCert(res.data);
      } catch (err) {
        console.error('Failed to load certificate', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificateId]);

  const handleDownloadPdf = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${API_BASE}/api/v1/certificates/${certificateId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-[#0d1527] p-8 rounded-xl border border-[#233458] text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading digital verification certificate...</p>
        </div>
      </div>
    );
  }

  if (!cert) return null;

  const snap = cert.certificate_data || {};
  const inst = snap.instrument || {};
  const org = snap.organization || {};

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0d1527] border-2 border-[#233458] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header Emblem */}
        <div className="text-center space-y-1.5 pb-4 border-b border-[#1a2745]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Government of Legal Metrology (Demo)
          </div>
          <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
            DIGITAL CERTIFICATE OF VERIFICATION
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Certificate Number: <b className="text-blue-400">{cert.certificate_number}</b>
          </p>
        </div>

        {/* Certificate Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" /> Instrument Identity
            </span>
            <p className="text-xs font-bold text-white mt-1">{inst.manufacturer} {inst.model}</p>
            <p className="text-[11px] text-slate-300 font-mono">Serial: {inst.serial_number}</p>
            <p className="text-[11px] text-slate-400">Capacity: {inst.capacity} {inst.capacity_unit}</p>
          </div>

          <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" /> Certified Premise
            </span>
            <p className="text-xs font-bold text-white mt-1">{org.name || 'ABC Retail Store'}</p>
            <p className="text-[11px] text-slate-300">{org.city}, {org.state}</p>
            <p className="text-[11px] text-slate-400">Owner: Ramesh Varma</p>
          </div>

          <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Statutory Validity
            </span>
            <p className="text-xs font-bold text-white mt-1">From: {cert.valid_from}</p>
            <p className="text-xs font-bold text-emerald-400">Valid Until: {cert.valid_until}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
              STATUS: {cert.status}
            </span>
          </div>

          <div className="bg-[#111c35] p-3.5 rounded-xl border border-[#1a2745] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Authorized Officer
            </span>
            <p className="text-xs font-bold text-white mt-1">{snap.verified_by || 'Rajesh Kumar'}</p>
            <p className="text-[11px] text-slate-400">Legal Metrology Officer</p>
            <p className="text-[10px] text-slate-500 font-mono">Issued: {cert.issued_at.split('T')[0]}</p>
          </div>
        </div>

        {/* QR Code Banner */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-24 h-24 bg-white p-2 rounded-lg shrink-0 flex items-center justify-center">
            <QrCode className="w-20 h-20 text-slate-950" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-white">Cryptographic QR Verification Active</p>
            <p className="text-slate-400 text-[11px]">
              Every issued certificate embeds a unique UUID token that resolves to our public verification route.
            </p>
            <button
              onClick={() => onNavigateToPublicVerify && onNavigateToPublicVerify(cert.qr_token)}
              className="text-blue-400 hover:text-blue-300 font-bold text-xs inline-flex items-center gap-1 pt-1"
            >
              <span>Test Public QR Route (`/verify/{cert.qr_token}`)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[10px] text-slate-500 max-w-xs text-center sm:text-left">
            Official certificate generated via ReportLab and verifiable by consumers & enforcement officers.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
