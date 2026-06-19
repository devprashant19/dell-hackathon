import React, { useState, useEffect } from 'react';
import { AlertOctagon, Wrench, FileText, ArrowRight, Terminal } from 'lucide-react';

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

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="text-slate-400 font-medium tracking-wide">Analyzing Graph Transversals...</div>
    </div>
  );
  if (!data) return <div className="p-12 text-center text-rose-400 font-bold">Failed to load device details.</div>;

  return (
    <div className="p-8 md:p-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-mono tracking-tight">{data.device_id}</h2>
          <p className="text-slate-400 mt-1 font-medium tracking-wide uppercase text-xs">Diagnostic Report</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className={`text-5xl font-black tracking-tighter drop-shadow-lg ${data.score === 100 ? 'text-emerald-400' : data.score > 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            {data.score}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">Compliance Score</div>
        </div>
      </div>

      {data.violations.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-10 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)] relative z-10">
          <div className="inline-flex p-4 bg-emerald-500/20 rounded-full text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <CheckCircle2 size={32} />
          </div>
          <div className="text-emerald-400 text-xl font-bold mb-2 tracking-wide">Device is Fully Compliant</div>
          <p className="text-emerald-500/70 text-sm font-medium">No conflicts or missing dependencies were found in the knowledge graph.</p>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-3">
            <AlertOctagon className="text-rose-400" /> 
            Identified Violations
            <span className="bg-rose-500/20 text-rose-400 text-xs px-2.5 py-0.5 rounded-full border border-rose-500/30">{data.violations.length}</span>
          </h3>
          
          {data.violations.map((v: any, idx: number) => (
            <div key={idx} className="glass-panel border-rose-500/30 rounded-2xl overflow-hidden hover:border-rose-500/50 transition-colors shadow-[0_0_20px_rgba(244,63,94,0.05)]">
              <div className="bg-gradient-to-r from-rose-500/10 to-transparent px-6 py-4 border-b border-rose-500/20 flex items-center gap-4">
                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                  <AlertOctagon size={20} />
                </div>
                <h4 className="font-bold text-rose-100 uppercase tracking-wider text-sm">{v.type.replace('_', ' ')}</h4>
                <span className="ml-auto text-xs font-bold text-rose-400 bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                  Penalty: -{v.penalty}
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-sm text-slate-300 leading-relaxed bg-black/40 p-5 rounded-xl border border-white/5 shadow-inner">
                  <span className="font-bold text-white block mb-2 text-xs uppercase tracking-widest text-indigo-400">Root Cause Explanation</span>
                  <p className="font-medium">{v.explanation}</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/10">
                  <FileText size={14} className="text-indigo-400" />
                  Source: <span className="text-indigo-300 font-bold">{v.source_doc}</span> (Rule {v.rule_id})
                </div>

                {v.remediations && v.remediations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <div className="p-1.5 bg-emerald-500/20 rounded-md text-emerald-400">
                        <Wrench size={16} />
                      </div>
                      Suggested Remediation
                    </h5>
                    <div className="space-y-4">
                      {v.remediations.map((rem: any, ridx: number) => (
                        <div key={ridx} className="space-y-4">
                          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-900/5 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4 shadow-lg">
                            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-0.5 border border-emerald-500/30">
                              {rem.action}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                {rem.component} <ArrowRight className="text-emerald-500/50" size={16} /> <span className="text-white">{rem.target_version}</span>
                              </p>
                              <p className="text-xs text-slate-400 mt-1.5 font-medium">{rem.impact}</p>
                            </div>
                            <div className="text-right bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                              <div className="text-emerald-400 font-black text-lg text-glow-emerald">{rem.simulated_score_after}</div>
                              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Impact</div>
                            </div>
                          </div>
                          
                          {/* IDE Style Terminal for Script */}
                          {rem.script && (
                            <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117] shadow-2xl mt-4">
                              <div className="bg-[#161b22] px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                </div>
                                <div className="ml-4 flex items-center gap-2 text-xs font-mono text-slate-400">
                                  <Terminal size={14} /> auto-remediate.ps1
                                </div>
                              </div>
                              <div className="p-4 overflow-x-auto">
                                <pre className="text-xs font-mono leading-relaxed">
                                  {rem.script.split('\n').map((line: string, i: number) => {
                                    const isComment = line.trim().startsWith('#');
                                    const isCommand = line.includes('Write-Host') || line.includes('Invoke-WebRequest') || line.includes('Start-Process');
                                    return (
                                      <div key={i} className="flex">
                                        <span className="w-6 text-slate-600 select-none border-r border-slate-800 mr-4 text-right pr-2">{i + 1}</span>
                                        <span className={`${isComment ? 'text-slate-500 italic' : isCommand ? 'text-blue-400' : 'text-slate-300'} whitespace-pre`}>
                                          {line}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </pre>
                              </div>
                            </div>
                          )}
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
