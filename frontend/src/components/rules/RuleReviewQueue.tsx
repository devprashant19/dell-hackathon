import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

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

  if (loading) return <div className="p-6 bg-slate-800 rounded-lg text-slate-400 animate-pulse">Loading Review Queue...</div>;

  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-lg max-h-[600px] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
        <Clock className="text-indigo-400" />
        Rule Review Queue
        {rules.length > 0 && (
          <span className="ml-2 bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full text-xs">
            {rules.length} Pending
          </span>
        )}
      </h2>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No pending rules in the queue.
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.rule_id} className="bg-slate-700/50 border border-slate-600 rounded-md p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">
                    <span className="text-indigo-400 uppercase text-xs font-bold mr-2 tracking-wide">{rule.rule_type}</span>
                    {rule.rule_id}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Source: {rule.source_doc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {rule.ambiguous && (
                    <span className="bg-amber-500/20 text-amber-300 py-0.5 px-2 rounded text-xs font-medium border border-amber-500/30">
                      Ambiguous
                    </span>
                  )}
                  <span className={`py-0.5 px-2 rounded text-xs font-medium border ${rule.confidence < 0.8 ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                    {(rule.confidence * 100).toFixed(0)}% Conf.
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-sm text-slate-300 italic font-mono text-xs">
                "{rule.raw_excerpt}"
              </div>
              
              {rule.extraction_notes && (
                <div className="bg-amber-900/20 p-2 rounded border border-amber-700/50 text-amber-200 text-xs mt-1">
                  <strong>Notes:</strong> {rule.extraction_notes}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setRules(rules.filter(r => r.rule_id !== rule.rule_id))}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(rule.rule_id)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm flex items-center gap-1"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
