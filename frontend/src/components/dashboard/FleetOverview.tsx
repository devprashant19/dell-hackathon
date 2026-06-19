import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DeviceDetail } from '../device/DeviceDetail';

interface DeviceScore {
  device_id: string;
  score: number;
  violations: any[];
}

export function FleetOverview() {
  const [devices, setDevices] = useState<DeviceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/devices');
      const data = await res.json();
      setDevices(data.sort((a: any, b: any) => a.score - b.score));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Connect to SSE for event-driven updates instead of polling
    const eventSource = new EventSource('http://localhost:8000/api/devices/stream');
    
    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
        fetchDevices();
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("SSE connection error", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (loading) return (
    <div className="p-8 glass-panel rounded-2xl flex items-center justify-center">
      <div className="animate-pulse flex items-center gap-3 text-blue-400">
        <Activity className="animate-spin-slow" size={24} />
        <span className="font-semibold text-lg">Synchronizing Graph Data...</span>
      </div>
    </div>
  );

  const compliant = devices.filter(d => d.score === 100).length;
  const nonCompliant = devices.length - compliant;
  const avgScore = devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + d.score, 0) / devices.length) : 0;

  return (
    <div className="space-y-8">
      {selectedDevice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass-panel border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedDevice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <DeviceDetail deviceId={selectedDevice} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-5 group">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Avg Fleet Score</p>
            <p className="text-4xl font-extrabold text-white mt-1 group-hover:text-glow transition-all">{avgScore}</p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl flex items-center gap-5 group">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Compliant</p>
            <p className="text-4xl font-extrabold text-emerald-400 mt-1 group-hover:text-glow-emerald transition-all">{compliant}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-5 group">
          <div className="p-4 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300">
            <ShieldAlert size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Violations</p>
            <p className="text-4xl font-extrabold text-rose-400 mt-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-all">{nonCompliant}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white">Device Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-4 font-bold">Device ID</th>
                <th className="px-8 py-4 font-bold w-1/3">Score</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map(device => (
                <tr key={device.device_id} className="hover:bg-white/5 transition-all duration-200 group">
                  <td className="px-8 py-5 font-mono text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{device.device_id}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-black/40 rounded-full h-2.5 max-w-[120px] overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${device.score === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : device.score > 60 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                          style={{ width: `${device.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white">{device.score}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {device.score === 100 ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 size={14} /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse-slow">
                        <ShieldAlert size={14} /> {device.violations.length} Violations
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => setSelectedDevice(device.device_id)}
                      className="text-sm font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 px-4 py-2 rounded-lg transition-all border border-indigo-500/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    >
                      View Details &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
