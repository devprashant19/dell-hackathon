import React, { useState } from 'react';
import { UploadCloud, AlertTriangle, FileUp } from 'lucide-react';

export function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setWarning(null);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('http://localhost:8000/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.warning) {
        setWarning(data.warning);
      }
      alert(`Upload complete. ${data.rules_extracted} rules extracted.`);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden group border border-white/10 shadow-2xl">
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl font-extrabold mb-6 text-white flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <UploadCloud size={24} />
          </div>
          Document Ingestion
        </h2>
        
        <div className={`relative border-2 border-dashed ${uploading ? 'border-indigo-400 bg-indigo-500/10 scale-[0.98]' : 'border-slate-600 hover:border-indigo-400 hover:bg-white/5'} rounded-2xl p-12 text-center transition-all duration-500 flex flex-col items-center justify-center min-h-[300px] overflow-hidden`}>
          
          {uploading && (
            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
          )}

          <input 
            type="file" 
            id="doc-upload" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center relative z-10">
            <div className={`mb-6 p-5 rounded-full ${uploading ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-bounce' : 'bg-white/5 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'} transition-all duration-300`}>
              <FileUp size={48} />
            </div>
            <span className="text-xl font-bold text-white mb-2">
              {uploading ? "Extracting Constraints via AI..." : "Select a Document"}
            </span>
            <span className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
              {uploading ? "Please wait while the engine parses the knowledge graph." : "Upload Vendor Compatibility Matrices or Release Notes (PDF)"}
            </span>
            
            {!uploading && (
              <span className="mt-8 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-full text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-colors">
                Browse Files
              </span>
            )}
          </label>
        </div>

        {warning && (
          <div className="mt-6 p-5 bg-gradient-to-r from-amber-500/10 to-amber-900/10 border border-amber-500/30 rounded-xl flex items-start gap-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400 flex-shrink-0 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-amber-400 font-extrabold text-sm uppercase tracking-widest mb-1">Warning: LLM Mock Mode</h4>
              <p className="text-amber-200/90 text-sm font-medium">{warning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
