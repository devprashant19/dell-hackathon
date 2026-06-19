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

  if (loading) return <div className="p-6 bg-slate-800 rounded-lg text-slate-400 animate-pulse">Loading Fleet Data...</div>;

  const compliant = devices.filter(d => d.score === 100).length;
  const nonCompliant = devices.length - compliant;
  const avgScore = devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + d.score, 0) / devices.length) : 0;

  return (
    <div className="space-y-6">
      {selectedDevice && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setSelectedDevice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              Close
            </button>
            <DeviceDetail deviceId={selectedDevice} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Avg Fleet Score</p>
            <p className="text-3xl font-bold text-white">{avgScore}</p>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Compliant</p>
            <p className="text-3xl font-bold text-emerald-400">{compliant}</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 rounded-full text-rose-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Violations</p>
            <p className="text-3xl font-bold text-rose-400">{nonCompliant}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Device Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Device ID</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {devices.map(device => (
                <tr key={device.device_id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-200">{device.device_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-700 rounded-full h-2 max-w-[100px]">
                        <div 
                          className={`h-2 rounded-full ${device.score === 100 ? 'bg-emerald-500' : device.score > 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${device.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-300">{device.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {device.score === 100 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={14} /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert size={14} /> {device.violations.length} Violations
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedDevice(device.device_id)}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
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
