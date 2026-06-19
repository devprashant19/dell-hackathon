import React, { useState } from 'react';
import { FleetOverview } from './components/dashboard/FleetOverview';
import { GraphExplorer } from './components/graph/GraphExplorer';
import { DocumentUpload } from './components/ingestion/DocumentUpload';
import { RuleReviewQueue } from './components/rules/RuleReviewQueue';
import { LayoutDashboard, Network, Upload, GitPullRequest } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-float pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px] animate-float-delayed pointer-events-none"></div>
      <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

      {/* Sidebar Navigation - Glassmorphism */}
      <aside className="w-72 glass-panel border-r border-white/10 flex-col hidden md:flex z-10">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-3xl font-extrabold bg-gradient-to-br from-blue-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent text-glow">
            CompatIQ
          </h1>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-[0.2em] font-semibold">Compliance Engine</p>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : ''} />
            Fleet Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('graph')}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'graph' ? 'bg-emerald-500/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <Network size={20} className={activeTab === 'graph' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : ''} />
            Knowledge Graph
          </button>
          
          <button 
            onClick={() => setActiveTab('ingestion')}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'ingestion' ? 'bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <Upload size={20} className={activeTab === 'ingestion' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : ''} />
            Document Ingestion
          </button>
          
          <button 
            onClick={() => setActiveTab('queue')}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'queue' ? 'bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)] border border-amber-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <GitPullRequest size={20} className={activeTab === 'queue' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''} />
            Review Queue
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <header className="p-6 border-b border-white/5 glass-panel sticky top-0 z-20 md:hidden">
          <h1 className="text-xl font-extrabold bg-gradient-to-br from-blue-400 to-emerald-400 bg-clip-text text-transparent">CompatIQ</h1>
        </header>
        
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-8">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">Fleet Compliance</h2>
                <p className="text-slate-400 mt-2 text-lg">Real-time status of all devices scored against the knowledge graph.</p>
              </div>
              <FleetOverview />
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-8">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">Knowledge Graph</h2>
                <p className="text-slate-400 mt-2 text-lg">Interactive visualization of all components, rules, and devices.</p>
              </div>
              <GraphExplorer />
            </div>
          )}

          {activeTab === 'ingestion' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-3xl">
              <div className="mb-8">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">Ingest Documents</h2>
                <p className="text-slate-400 mt-2 text-lg">Upload vendor compatibility matrices and release notes for extraction.</p>
              </div>
              <DocumentUpload />
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl">
              <div className="mb-8">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">Review Queue</h2>
                <p className="text-slate-400 mt-2 text-lg">Review, approve, or reject extracted rules before committing to the graph.</p>
              </div>
              <RuleReviewQueue />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
