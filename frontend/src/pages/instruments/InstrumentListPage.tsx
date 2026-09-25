import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Instrument } from '../../types';
import { Scale, Plus, Smartphone, CheckCircle2, AlertTriangle, Shield, Search } from 'lucide-react';

interface InstrumentListPageProps {
  onOpenPassport: (id: string) => void;
}

export const InstrumentListPage: React.FC<InstrumentListPageProps> = ({ onOpenPassport }) => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [manufacturer, setManufacturer] = useState('Apex Instruments');
  const [model, setModel] = useState('EW-30');
  const [serial, setSerial] = useState('AP-EW-2026-00129');
  const [capacity, setCapacity] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/instruments/');
      setInstruments(res.data);
    } catch (err) {
      console.error('Failed to load instruments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/instruments/', {
        manufacturer,
        model,
        serial_number: serial,
        capacity: parseFloat(capacity),
        capacity_unit: 'kg',
        instrument_type: 'ELECTRONIC_WEIGHING',
        manufacture_year: 2026,
        location_description: 'Counter 03 - Front Desk'
      });
      setModalOpen(false);
      fetchInstruments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register instrument');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2745]">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Registered Legal Metrology Instruments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Digital Instrument Registry & Passport Generation (SIH-26036)
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Instrument</span>
        </button>
      </div>

      {/* Instruments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instruments.map((inst) => (
          <div
            key={inst.id}
            className="bg-[#0d1527] border border-[#1a2745] hover:border-blue-500/50 p-5 rounded-xl shadow-lg transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Passport ID</span>
                <p className="text-sm font-extrabold text-blue-400 font-mono">{inst.passport_id}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                inst.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                inst.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {inst.status}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-white text-sm">{inst.manufacturer} {inst.model}</p>
              <p className="text-slate-400 font-mono text-[11px]">Serial: {inst.serial_number}</p>
              <p className="text-slate-300">Verified Capacity: <b>{inst.capacity} {inst.capacity_unit}</b></p>
              <p className="text-[11px] text-slate-500 truncate">{inst.location_description || 'Retail Counter'}</p>
            </div>

            <button
              onClick={() => onOpenPassport(inst.id)}
              className="w-full py-2 px-3 rounded-lg bg-[#111c35] hover:bg-[#1a2745] text-blue-400 hover:text-blue-300 text-xs font-bold border border-[#233458] flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Digital Passport</span>
            </button>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1527] border border-[#233458] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2745]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Weighing Scale</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manufacturer</label>
                <input
                  type="text"
                  required
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Model Code</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Serial Number</label>
                <input
                  type="text"
                  required
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Capacity (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-[#111c35] border border-[#233458] rounded-md p-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1a2745]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {submitting ? 'Registering...' : 'Register & Generate Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
