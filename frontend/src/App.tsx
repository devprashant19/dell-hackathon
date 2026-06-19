import React, { useState } from 'react';
import { FleetOverview } from './components/dashboard/FleetOverview';
import { GraphExplorer } from './components/graph/GraphExplorer';
import { DocumentUpload } from './components/ingestion/DocumentUpload';
import { RuleReviewQueue } from './components/rules/RuleReviewQueue';
import { LayoutDashboard, Network, Upload, GitPullRequest } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            CompatIQ
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Compliance Engine</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-blue-400' : ''} />
            Fleet Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('graph')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'graph' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <Network size={18} className={activeTab === 'graph' ? 'text-emerald-400' : ''} />
            Knowledge Graph
          </button>
          
          <button 
            onClick={() => setActiveTab('ingestion')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ingestion' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <Upload size={18} className={activeTab === 'ingestion' ? 'text-indigo-400' : ''} />
            Document Ingestion
          </button>
          
          <button 
            onClick={() => setActiveTab('queue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'queue' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <GitPullRequest size={18} className={activeTab === 'queue' ? 'text-amber-400' : ''} />
            Review Queue
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-900">
        <header className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 md:hidden">
          <h1 className="text-xl font-bold text-white">CompatIQ</h1>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Fleet Compliance Overview</h2>
                <p className="text-slate-400 mt-1">Real-time status of all devices scored against the knowledge graph.</p>
              </div>
              <FleetOverview />
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Knowledge Graph Explorer</h2>
                <p className="text-slate-400 mt-1">Interactive visualization of all components, rules, and devices.</p>
              </div>
              <GraphExplorer />
            </div>
          )}

          {activeTab === 'ingestion' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Ingest Vendor Documentation</h2>
                <p className="text-slate-400 mt-1">Upload compatibility matrices and release notes for extraction.</p>
              </div>
              <DocumentUpload />
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Pending Rule Extraction</h2>
                <p className="text-slate-400 mt-1">Review, approve, or reject rules before they enter the graph.</p>
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
