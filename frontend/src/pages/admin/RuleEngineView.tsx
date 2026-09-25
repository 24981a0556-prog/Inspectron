import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Sliders, ShieldCheck, Check, Plus, AlertTriangle, Layers } from 'lucide-react';

export const RuleEngineView: React.FC = () => {
  const [ruleSets, setRuleSets] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/rules/rulesets/');
        setRuleSets(res.data);
        if (res.data.length > 0) {
          const rulesRes = await apiClient.get(`/rules/rulesets/${res.data[0].id}/rules`);
          setRules(rulesRes.data);
        }
      } catch (err) {
        console.error('Failed to load rulesets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2745]">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Configurable Regulatory Rule Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Versioned Regulatory Inspection Rules for Legal Metrology Instruments (SIH-26036)
          </p>
        </div>
      </div>

      {/* Ruleset Summary Card */}
      <div className="bg-[#0d1527] border border-[#1a2745] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Electronic Weighing Instrument — Demo Rules v1.0</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  STATUS: ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Target Category: Non-Automatic Electronic Weighing Scales</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Effective Date: 2026-01-01</span>
        </div>

        {/* Claim Boundary Disclaimer */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            <b>Claim Boundary Notice:</b> Rule validation parameters in this prototype are configurable demonstration rules.
            They demonstrate automated evidence verification without fabricating official statutory tolerance values.
          </span>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#111c35] text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Rule Code</th>
                <th className="p-3">Condition Description</th>
                <th className="p-3">Field Target</th>
                <th className="p-3">Validation Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2745]">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#111c35]/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{rule.rule_code}</td>
                  <td className="p-3 font-semibold text-slate-200">{rule.description}</td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{rule.field_path}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20 font-bold">
                      {rule.condition_type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      rule.severity === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
