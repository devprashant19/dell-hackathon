import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Cpu, GitPullRequest } from 'lucide-react';

interface Rule {
  rule_id: string;
  source_doc: string;
  rule_type: string;
  confidence: number;
  ambiguous: boolean;
  raw_excerpt: string;
  extraction_notes?: string;
}

export function RuleReviewQueue() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ingest/queue');
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (ruleId: string) => {
    try {
      await fetch(`http://localhost:8000/api/ingest/queue/approve?rule_id=${ruleId}`, { method: 'POST' });
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="p-8 glass-panel rounded-2xl flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="text-slate-400 font-medium tracking-wide">Syncing Review Queue...</div>
    </div>
  );

  return (
    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <h2 className="text-2xl font-extrabold mb-8 text-white flex items-center gap-3 tracking-tight relative z-10">
        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <GitPullRequest size={24} />
        </div>
        Pending Rule Extraction
        {rules.length > 0 && (
          <span className="ml-2 bg-amber-500/20 text-amber-400 py-1 px-3 rounded-lg text-xs border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            {rules.length} Pending
          </span>
        )}
      </h2>

      {rules.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 relative z-10">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-400 mb-4 border border-emerald-500/20">
            <CheckCircle size={32} />
          </div>
          <p className="text-slate-300 font-medium text-lg">Queue is Empty</p>
          <p className="text-slate-500 text-sm mt-1">All extracted rules have been processed.</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
          {rules.map(rule => (
            <div key={rule.rule_id} className="glass-card border-white/10 rounded-2xl p-6 flex flex-col gap-5 hover:border-amber-500/30 group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-indigo-400 h-fit border border-white/10 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {rule.rule_type}
                      </span>
                      {rule.rule_id}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Source: <span className="text-indigo-300">{rule.source_doc}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.ambiguous && (
                    <span className="bg-amber-500/20 text-amber-400 py-1 px-2.5 rounded-lg text-xs font-bold border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      Ambiguous
                    </span>
                  )}
                  <span className={`py-1 px-2.5 rounded-lg text-xs font-bold border shadow-lg ${rule.confidence < 0.8 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`}>
                    {(rule.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
              </div>
              
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Raw Text Excerpt</div>
                <p className="text-sm text-slate-300 font-mono leading-relaxed">
                  "{rule.raw_excerpt}"
                </p>
              </div>
              
              {rule.extraction_notes && (
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-3 rounded-lg border-l-2 border-amber-500 text-amber-200/90 text-xs font-medium">
                  <strong className="text-amber-400 uppercase tracking-wider text-[10px]">AI Note:</strong> {rule.extraction_notes}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2 border-t border-white/5 pt-4">
                <button 
                  onClick={() => setRules(rules.filter(r => r.rule_id !== rule.rule_id))}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent transition-all flex items-center gap-2"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(rule.rule_id)}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Approve & Commit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
