import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { Verification, RuleValidationResult } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  Sliders,
  Send,
  CloudOff,
  RefreshCw,
  Scale,
  ShieldCheck,
  FileCheck,
  Check,
  X
} from 'lucide-react';

interface FieldVerificationViewProps {
  onVerificationSubmitted?: () => void;
}

export const FieldVerificationView: React.FC<FieldVerificationViewProps> = ({
  onVerificationSubmitted
}) => {
  const { user } = useAuthStore();
  const { addToQueue, queue, syncQueue, isSyncing } = useOfflineQueueStore();

  const [activeStep, setActiveStep] = useState(1);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [checklist, setChecklist] = useState({
    zero_error_checked: true,
    readability_checked: true,
    leveling_checked: true,
    seal_integrity_checked: true
  });

  const [readings, setReadings] = useState([
    { nominal_kg: 5.0, observed_kg: 5.000, error_g: 0.0, status: 'PASS' },
    { nominal_kg: 15.0, observed_kg: 15.002, error_g: 2.0, status: 'PASS' },
    { nominal_kg: 30.0, observed_kg: 30.005, error_g: 5.0, status: 'PASS' }
  ]);

  const [remarks, setRemarks] = useState(
    'Instrument tested with standard calibrated class M1 weights. Zero error verified. Error within permissible tolerance.'
  );

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 17.7041,
    lng: 83.2977
  });

  // Offline toggle simulation
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Rule engine result
  const [validationResult, setValidationResult] = useState<RuleValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize field session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        // Get or create assignment
        const assignRes = await apiClient.get('/assignments/');
        let assignmentId = '';
        if (assignRes.data.length > 0) {
          assignmentId = assignRes.data[0].id;
        } else {
          // If none, get first application and create assignment
          const appRes = await apiClient.get('/applications/');
          if (appRes.data.length > 0) {
            const newAssign = await apiClient.post('/assignments/', {
              application_id: appRes.data[0].id,
              assigned_officer_id: user?.id || 'officer-uuid',
              scheduled_date: '2026-09-26',
              scheduled_time_slot: '10:00 AM - 01:00 PM',
              location_note: 'Counter 02'
            });
            assignmentId = newAssign.data.id;
          }
        }

        if (assignmentId) {
          const verifRes = await apiClient.post('/verifications/', {
            assignment_id: assignmentId
          });
          setVerification(verifRes.data);
          if (verifRes.data.rule_validation_result) {
            setValidationResult(verifRes.data.rule_validation_result);
          }
        }
      } catch (err) {
        console.error('Failed to init verification session', err);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Save draft incremental update
  const saveDraft = async () => {
    if (!verification) return;
    try {
      await apiClient.patch(`/verifications/${verification.id}`, {
        checklist_data: checklist,
        measurement_data: { readings },
        officer_remarks: remarks,
        latitude: location?.lat,
        longitude: location?.lng
      });
    } catch (err) {
      console.warn('Draft save notice', err);
    }
  };

  // Upload or Queue photo evidence (Correction 3)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !verification) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      if (simulateOffline) {
        // Resilient offline queue storage
        addToQueue({
          verificationId: verification.id,
          filename: file.name,
          fileBase64: base64,
          mimeType: file.type || 'image/jpeg',
          description: 'Geotagged physical instrument seal & display'
        });
        alert('Offline mode active: Photo queued locally in browser storage.');
      } else {
        // Direct API upload (StorageBackend + DB metadata)
        try {
          const formData = new FormData();
          formData.append('verification_id', verification.id);
          formData.append('description', 'Geotagged physical instrument seal & display');
          formData.append('file', file);

          await apiClient.post('/evidence/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Refresh verification
          const ref = await apiClient.get(`/verifications/${verification.id}`);
          setVerification(ref.data);
          alert('Photo uploaded & stored successfully.');
        } catch (err) {
          console.error('Upload failed, falling back to offline queue', err);
          addToQueue({
            verificationId: verification.id,
            filename: file.name,
            fileBase64: base64,
            mimeType: file.type || 'image/jpeg',
            description: 'Geotagged physical instrument seal & display'
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Rule Engine on complete persisted data (Correction 4)
  const handleValidate = async () => {
    if (!verification) return;
    setValidating(true);
    try {
      // 1. Persist latest drafts first
      await saveDraft();

      // 2. Explicit rule engine call
      const res = await apiClient.post(`/verifications/${verification.id}/validate`);
      setValidationResult(res.data.rule_validation_result);
      setActiveStep(5);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rule validation failed');
    } finally {
      setValidating(false);
    }
  };

  // Submit and lock verification
  const handleSubmitVerification = async () => {
    if (!verification) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/verifications/${verification.id}/submit`);
      setSuccessMsg('Field verification submitted and locked! Ready for LMO Authorized Decision.');
      if (onVerificationSubmitted) {
        onVerificationSubmitted();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Submission failed. Please ensure rule validation passed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono">Initializing field verification environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Field Officer Banner */}
      <div className="bg-[#0d1527] border border-[#1a2745] p-5 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white font-mono">Field Verification Mobile Console</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              GATC Officer Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Target Scale: <b>Apex Instruments EW-30</b> (30 kg) · ABC Retail Store
          </p>
        </div>

        {/* Offline Simulation Switcher */}
        <div className="flex items-center gap-3 bg-[#111c35] p-2 rounded-lg border border-[#233458]">
          <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Offline Mode</span>
          </span>
          <button
            onClick={() => setSimulateOffline(!simulateOffline)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${simulateOffline ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${simulateOffline ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { num: 1, title: 'Identity' },
          { num: 2, title: 'Checklist' },
          { num: 3, title: 'Readings' },
          { num: 4, title: 'Evidence' },
          { num: 5, title: 'Validate' }
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setActiveStep(s.num)}
            className={`p-2.5 rounded-lg border transition-all ${
              activeStep === s.num
                ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md'
                : 'bg-[#0d1527] text-slate-400 border-[#1a2745] hover:text-white'
            }`}
          >
            <span className="block text-[10px] font-mono opacity-80">STEP 0{s.num}</span>
            <span className="truncate">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[#0d1527] border border-[#1a2745] rounded-xl p-6 shadow-xl space-y-6">
        {/* STEP 1: IDENTITY */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" /> Confirm Physical Instrument Identity
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Manufacturer</span>
                <p className="font-bold text-white mt-0.5">Apex Instruments</p>
              </div>
              <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Model Code</span>
                <p className="font-bold text-white mt-0.5">EW-30</p>
              </div>
              <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Serial Number</span>
                <p className="font-mono font-bold text-white mt-0.5">AP-EW-2026-00128</p>
              </div>
              <div className="bg-[#111c35] p-3 rounded-lg border border-[#1a2745]">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Verification Capacity</span>
                <p className="font-mono font-bold text-white mt-0.5">30.0 kg</p>
              </div>
            </div>

            {/* Geolocation Tagging */}
            <div className="p-3 bg-[#111c35] rounded-lg border border-[#1a2745] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Geotag Location Captured: <b>17.7041° N, 83.2977° E</b> (Visakhapatnam)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">GPS LOCKED</span>
            </div>

            <button
              onClick={() => setActiveStep(2)}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Confirm Identity & Proceed to Checklist →
            </button>
          </div>
        )}

        {/* STEP 2: CHECKLIST */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Inspection Checklist Observations
            </h2>

            <div className="space-y-2.5">
              {[
                { key: 'zero_error_checked', label: 'Zero Setting Error Observation', desc: 'Instrument accurately zeros without dead weight error.' },
                { key: 'readability_checked', label: 'Display Readability & Illumination', desc: 'Seven-segment LED display is clearly visible to consumer and merchant.' },
                { key: 'leveling_checked', label: 'Spirit Level & Foot Leveling Stability', desc: 'Bubble spirit level is centered and bench footing is rigid.' },
                { key: 'seal_integrity_checked', label: 'Physical Regulatory Seal Integrity', desc: 'Lead / tamper-evident security seal is intact without interference.' }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 bg-[#111c35] rounded-lg border border-[#1a2745] hover:border-[#233458] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(checklist as any)[item.key]}
                    onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-500 focus:ring-0 bg-[#0a0f1e] border-slate-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveStep(1)}
                className="w-1/3 py-2.5 rounded-lg bg-[#111c35] text-slate-300 font-bold text-xs hover:bg-[#1a2745]"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="w-2/3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Save & Proceed to Measurements →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MEASUREMENTS */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Test Load Readings (Standard Calibrated Weights)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#111c35] text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Standard Load</th>
                    <th className="p-2.5">Observed Reading</th>
                    <th className="p-2.5">Error (g)</th>
                    <th className="p-2.5">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2745]">
                  {readings.map((r, i) => (
                    <tr key={i} className="hover:bg-[#111c35]/50">
                      <td className="p-2.5 font-mono font-bold text-white">{r.nominal_kg} kg</td>
                      <td className="p-2.5 font-mono text-slate-200">{r.observed_kg.toFixed(3)} kg</td>
                      <td className="p-2.5 font-mono text-slate-200">+{r.error_g} g</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          PASS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Officer Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Verifying Officer Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveStep(2)}
                className="w-1/3 py-2.5 rounded-lg bg-[#111c35] text-slate-300 font-bold text-xs hover:bg-[#1a2745]"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="w-2/3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Proceed to Evidence Capture →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE CAPTURE */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" /> Evidence Capture & Geotagged Photos
              </h2>
              {simulateOffline && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <CloudOff className="w-3.5 h-3.5" /> Offline Capture Queue Active
                </span>
              )}
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#233458] hover:border-emerald-500/60 p-6 rounded-xl text-center space-y-2 transition-colors">
              <Camera className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white">Capture / Upload Scale & Seal Photo</p>
              <p className="text-[11px] text-slate-400">
                Supports camera capture directly from mobile devices or image upload.
              </p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                id="camera-input"
              />
              <label
                htmlFor="camera-input"
                className="inline-block mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Take Photo or Choose File
              </label>
            </div>

            {/* Evidence items count */}
            <div className="p-3 bg-[#111c35] rounded-lg border border-[#1a2745] flex items-center justify-between text-xs">
              <span>Attached Evidence Photos: <b>{(verification?.evidence?.length || 0) + queue.length}</b></span>
              <span className="text-emerald-400 font-bold">Required Minimum: 1 Photo</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveStep(3)}
                className="w-1/3 py-2.5 rounded-lg bg-[#111c35] text-slate-300 font-bold text-xs hover:bg-[#1a2745]"
              >
                ← Back
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="w-2/3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>{validating ? 'Evaluating Rules...' : 'Run Regulatory Rule Engine →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REGULATORY RULE ENGINE VALIDATION */}
        {activeStep === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2745]">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Regulatory Rule Engine Evaluation
                </h2>
                <p className="text-[11px] text-slate-400">
                  Version: <b>Electronic Weighing Instrument v1.0</b> (Evaluated on live inspection data)
                </p>
              </div>

              {validationResult && (
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  validationResult.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {validationResult.passed ? 'ALL RULES PASSED' : 'VIOLATIONS DETECTED'}
                </span>
              )}
            </div>

            {/* Detailed Rule Breakdown */}
            <div className="space-y-2">
              {validationResult?.results?.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    r.status === 'PASS'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300">{r.rule_code}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/10">
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{r.description}</p>
                    {r.detail && <p className="text-[10px] text-red-300/80">{r.detail}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {r.status === 'PASS' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-4 h-4" /> PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="w-4 h-4" /> FAIL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Statutory Disclaimer */}
            <p className="text-[10px] text-slate-500">
              Disclaimer: Rule parameters in this prototype are illustrative for demonstration of the rule engine architecture and do not invent official statutory tolerance values.
            </p>

            {/* Lock and Submit Button */}
            <button
              onClick={handleSubmitVerification}
              disabled={submitting || !validationResult?.passed}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Locking & Submitting...' : 'Confirm & Submit Verification to LMO'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
