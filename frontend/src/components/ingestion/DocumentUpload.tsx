import React, { useState } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';

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
    <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
        <UploadCloud className="text-blue-400" />
        Document Ingestion
      </h2>
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:bg-slate-700 transition-colors">
        <input 
          type="file" 
          id="doc-upload" 
          className="hidden" 
          onChange={handleUpload}
          disabled={uploading}
        />
        <label htmlFor="doc-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">
          {uploading ? "Uploading and processing..." : "Click to upload a PDF or drag and drop"}
        </label>
        <p className="text-sm text-slate-400 mt-2">Vendor compatibility matrices or release notes</p>
      </div>

      {warning && (
        <div className="mt-4 p-4 bg-amber-900/50 border border-amber-600/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-amber-500 font-medium text-sm">Warning: LLM Mock Mode</h4>
            <p className="text-amber-200/80 text-sm mt-1">{warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
