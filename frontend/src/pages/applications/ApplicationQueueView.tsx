import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { Application, User } from '../../types';
import {
  FileText,
  Clock,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Award,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplicationQueueViewProps {
  onViewCertificate?: (certId: string) => void;
  onNavigateToFieldVerify?: (assignmentId: string) => void;
}

export const ApplicationQueueView: React.FC<ApplicationQueueViewProps> = ({
  onViewCertificate,
  onNavigateToFieldVerify
}) => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-09-26');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [locationNote, setLocationNote] = useState('Ground Floor, Counter 02');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications/');
      setApplications(res.data);
      if (res.data.length > 0) {
        setSelectedApp(res.data[0]);
      }

      // Fetch officers list for assignment dropdown
      const usersRes = await apiClient.get('/users/');
      const gatcOfficers = usersRes.data.filter((u: User) => u.role === 'GATC' || u.role === 'LMO');
      setOfficers(gatcOfficers);
      if (gatcOfficers.length > 0) {
        setSelectedOfficerId(gatcOfficers[0].id);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/applications/${selectedApp.id}/review`, {
        notes: 'Application documentation verified. Ready for officer scheduling.'
      });
      setFeedbackMsg({ type: 'success', text: 'Application reviewed and moved to UNDER_REVIEW.' });
      await fetchApps();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Review failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedApp || !selectedOfficerId) return;
    setActionLoading(true);
    try {
      await apiClient.post('/assignments/', {
        application_id: selectedApp.id,
        assigned_officer_id: selectedOfficerId,
        scheduled_date: scheduledDate,
        scheduled_time_slot: timeSlot,
        location_note: locationNote
      });
      setAssignModalOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Inspection assigned and scheduled successfully.' });
      await fetchApps();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Assignment failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthorize = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/applications/${selectedApp.id}/authorize`, {
        decision,
        remarks: decision === 'APPROVED'
          ? 'Statutory compliance verified under Legal Metrology Rules.'
          : 'Inspection did not meet statutory tolerance standards.'
      });
      setFeedbackMsg({
        type: 'success',
        text: `Application ${decision === 'APPROVED' ? 'Approved & Authorized' : 'Rejected'}.`
      });
      await fetchApps();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Authorization failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post('/certificates/', {
        application_id: selectedApp.id
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setFeedbackMsg({
        type: 'success',
        text: `Certificate ${res.data.certificate_number} generated successfully with embedded QR code!`
      });
      if (onViewCertificate) {
        onViewCertificate(res.data.id);
      }
      await fetchApps();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.detail || 'Certificate generation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2745]">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Verification Applications & Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            LMO Statutory Review, Assignment Scheduling, and Authorized Decisions (SIH-26036)
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/30 border-red-500/40 text-red-300'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Layout: List on Left, Detail & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Applications List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold uppercase tracking-wider">Applications Queue</span>
            <span>{applications.length} Records</span>
          </div>

          <div className="space-y-2">
            {applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#111c35] border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-[#0d1527] border-[#1a2745] hover:border-[#233458]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-white">{app.application_number}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      app.status === 'SUBMITTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      app.status === 'ASSIGNED' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      app.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-slate-700/20 text-slate-300 border-slate-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold truncate">{app.purpose || 'Initial Statutory Verification'}</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-[#1a2745]">
                    <span>Type: {app.application_type}</span>
                    <span>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Application Details & Action Console */}
        <div className="lg:col-span-7 bg-[#0d1527] border border-[#1a2745] rounded-xl p-6 shadow-xl space-y-6">
          {selectedApp ? (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1a2745]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Selected Case File</span>
                  <h2 className="text-lg font-bold text-white font-mono">{selectedApp.application_number}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedApp.purpose}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Current State</span>
                  <span className="text-xs font-extrabold text-blue-400 font-mono">{selectedApp.status}</span>
                </div>
              </div>

              {/* Instrument & Applicant Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Instrument Model</span>
                  <p className="text-xs font-bold text-white mt-0.5">Apex Instruments EW-30</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Serial: AP-EW-2026-00128</p>
                </div>
                <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Submitting Organization</span>
                  <p className="text-xs font-bold text-white mt-0.5">ABC Retail Store</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Visakhapatnam, Andhra Pradesh</p>
                </div>
              </div>

              {/* LMO Action Console (Driven by State Machine) */}
              <div className="p-4 bg-[#111c35] rounded-xl border border-[#233458] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Statutory LMO Decision & Action Console</span>
                </div>

                {/* State 1: SUBMITTED -> LMO Reviews */}
                {selectedApp.status === 'SUBMITTED' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Application submitted by retailer is awaiting legal metrology review.
                    </p>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleReview}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        {actionLoading ? 'Processing...' : 'Review & Move to Under Review'}
                      </button>
                    </div>
                  </div>
                )}

                {/* State 2: UNDER_REVIEW -> Assign Officer */}
                {selectedApp.status === 'UNDER_REVIEW' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Application is under review. Next step: Schedule inspection & assign GATC Field Officer.
                    </p>
                    <button
                      onClick={() => setAssignModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Schedule & Assign Field Officer</span>
                    </button>
                  </div>
                )}

                {/* State 3: ASSIGNED / IN_PROGRESS */}
                {(selectedApp.status === 'ASSIGNED' || selectedApp.status === 'IN_PROGRESS') && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-blue-300">Field Inspection in Progress</span>
                      <p className="text-slate-400 text-[11px]">
                        Officer assigned: <b>Suresh Naidu (GATC Field Officer)</b>. Test measurements, checklist, and evidence photos are being captured.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1a2745] flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => onNavigateToFieldVerify && onNavigateToFieldVerify(selectedApp.id)}
                        className="px-3.5 py-1.5 rounded bg-[#1a2745] hover:bg-[#233458] text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Inspect Field Verification Session</span>
                      </button>

                      {/* Authorized Decision Buttons (Correction 5) */}
                      <button
                        onClick={() => handleAuthorize('APPROVED')}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize Decision: APPROVE</span>
                      </button>

                      <button
                        onClick={() => handleAuthorize('REJECTED')}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State 4: APPROVED -> Ready for Certificate Issuance (Correction 5) */}
                {selectedApp.status === 'APPROVED' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Statutory Approval Granted</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/80">
                        Field verification and regulatory rules verified. You may now generate the official Digital Verification Certificate with embedded cryptographic QR code.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateCertificate}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>{actionLoading ? 'Rendering PDF & QR...' : 'Generate Digital Verification Certificate'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select an application from the queue to view details and statutory actions.
            </div>
          )}
        </div>
      </div>

      {/* Assignment Scheduling Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1527] border border-[#233458] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2745]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule Field Verification</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Field Officer (GATC)</label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                >
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.full_name} ({off.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scheduled Inspection Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Time Slot</label>
                <input
                  type="text"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Premise / Counter Note</label>
                <input
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1a2745]">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                {actionLoading ? 'Scheduling...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
