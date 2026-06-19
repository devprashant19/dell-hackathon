import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export function GraphExplorer() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/graph');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, []);

  if (loading) return <div className="p-6 bg-slate-800 rounded-lg text-slate-400 animate-pulse h-[600px] flex items-center justify-center">Loading Knowledge Graph...</div>;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden relative" style={{ height: '600px' }}>
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-3 rounded-lg border border-slate-700 backdrop-blur text-sm">
        <h3 className="text-white font-semibold mb-2">Graph Legend</h3>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-300">Component</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-300">Device</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-slate-300">Rule</span></div>
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (node.group === 1) return '#3b82f6'; // Component
          if (node.group === 2) return '#10b981'; // Device
          if (node.group === 3) return '#6366f1'; // Rule
          return '#64748b'; // Unknown
        }}
        linkColor={() => 'rgba(148, 163, 184, 0.4)'}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        width={typeof window !== 'undefined' ? window.innerWidth - 300 : 800}
        height={600}
      />
    </div>
  );
}
