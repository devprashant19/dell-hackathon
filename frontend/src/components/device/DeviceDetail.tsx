import React, { useState, useEffect } from 'react';
import { AlertOctagon, Wrench, FileText, ArrowRight } from 'lucide-react';

export function DeviceDetail({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/devices/${deviceId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [deviceId]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading device details...</div>;
  if (!data) return <div className="p-8 text-center text-rose-400">Failed to load device details.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono">{data.device_id}</h2>
          <p className="text-slate-400 mt-1">Compliance Report</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white mb-1">{data.score}</div>
          <div className="text-sm font-medium uppercase tracking-widest text-slate-500">Score</div>
        </div>
      </div>

      {data.violations.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-8 text-center">
          <div className="text-emerald-400 text-lg font-medium mb-2">Device is Fully Compliant</div>
          <p className="text-emerald-500/70 text-sm">No known conflicts or missing dependencies were found in the knowledge graph.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Identified Violations</h3>
          
          {data.violations.map((v: any, idx: number) => (
            <div key={idx} className="bg-slate-800 border border-rose-500/30 rounded-lg overflow-hidden">
              <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/20 flex items-center gap-3">
                <AlertOctagon className="text-rose-400 flex-shrink-0" size={20} />
                <h4 className="font-semibold text-rose-100">{v.type.replace('_', ' ')}</h4>
                <span className="ml-auto text-xs font-mono text-rose-400/80 bg-rose-500/10 px-2 py-1 rounded">
                  Penalty: -{v.penalty}
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-700">
                  <span className="font-semibold text-white block mb-1">Root Cause Explanation:</span>
                  {v.explanation}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <FileText size={14} />
                  Source: <span className="text-indigo-400">{v.source_doc}</span> (Rule {v.rule_id})
                </div>

                {v.remediations && v.remediations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h5 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                      <Wrench size={16} className="text-emerald-400" /> 
                      Suggested Remediation (Simulated)
                    </h5>
                    <div className="space-y-2">
                      {v.remediations.map((rem: any, ridx: number) => (
                        <div key={ridx} className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-md flex items-start gap-4">
                          <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mt-0.5">
                            {rem.action}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-200">
                              {rem.component} <ArrowRight className="inline mx-1 text-slate-500" size={14} /> {rem.target_version}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{rem.impact}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-sm">{rem.simulated_score_after}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Score Impact</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
