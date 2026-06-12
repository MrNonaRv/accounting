import React, { useState, useRef } from 'react';
import { FundId, FUNDS } from '../types';
import { 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  HelpCircle, 
  ArrowRight, 
  FileCode,
  Loader2,
  Trash2
} from 'lucide-react';

interface AccessDbImportProps {
  currentFund: FundId;
}

export default function AccessDbImport({ currentFund }: AccessDbImportProps) {
  const [targetFund, setTargetFund] = useState<FundId>(currentFund);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    log?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'mdb' || ext === 'accdb') {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setFile(null);
      setStatus({
        success: false,
        message: `Unsupported file extension (${ext}). Please upload a valid Microsoft Access .mdb or .accdb database file.`
      });
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const base64 = await convertFileToBase64(file);
      
      const response = await fetch('/api/import-access-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fund: targetFund,
          filename: file.name,
          base64: base64
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          success: true,
          message: result.message,
          log: result.log
        });
        removeFile();
      } else {
        setStatus({
          success: false,
          message: result.error || "Database extraction or migration failed.",
          log: result.log
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        success: false,
        message: err.message || "An error occurred while transmitting or parsing the database."
      });
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (fileToConvert: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToConvert);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Split off data:application/octet-stream;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title block */}
      <div>
        <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Microsoft Access Database Import</h3>
        <p className="text-xs text-slate-500 font-semibold font-sans mt-1">
          Directly upload, convert, and synchronize physical MS Access fund databases into the unified SQLite Ledger
        </p>
      </div>

      {/* Primary configuration card */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Step 1: select fund map */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-navy text-white text-[10px] font-mono font-bold">1</span>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy font-mono">Map Target Fund</h4>
          </div>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Specify which municipal registry receives and replaces its tables with this imported database.
          </p>
          <div className="pt-2">
            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
              Target Fund
            </label>
            <select
              value={targetFund}
              onChange={(e) => setTargetFund(e.target.value as FundId)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 text-xs rounded px-3 py-2.5 outline-none focus:border-brand-navy cursor-pointer transition-all font-medium font-sans"
            >
              {FUNDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div id="dropzone-step" className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-navy text-white text-[10px] font-mono font-bold">2</span>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy font-mono">Upload physical file</h4>
          </div>
          
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-brand-navy bg-brand-navy/5' 
                  : 'border-slate-200 hover:border-brand-navy bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mdb,.accdb"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-white rounded-full border border-slate-100 shadow-xs">
                <Upload className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 font-sans">
                  Drag and drop Microsoft Access file here, or <span className="text-brand-navy underline">browse files</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">
                  Accepts .MDB & .ACCDB files (max 100MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded p-4.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#002147]/5 text-brand-navy rounded border border-[#002147]/10">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-850 font-sans truncate max-w-md">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to migrate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={loading}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 transition-all cursor-pointer"
                  title="Remove selected file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-brand-navy hover:bg-brand-navy/90 text-white font-mono text-[11px] uppercase tracking-wider font-extrabold px-4.5 py-2 rounded-md shadow-xs flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Import Database</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress / Success / Errors feedback banner */}
      {status && (
        <div className={`p-5 rounded border ${
          status.success 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-850' 
            : 'bg-rose-50/50 border-rose-100 text-rose-900'
        } space-y-3`}>
          <div className="flex items-start gap-3">
            {status.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                {status.success ? 'Migration Success' : 'Migration Error'}
              </h4>
              <p className="text-xs font-sans mt-1 leading-relaxed">
                {status.message}
              </p>
            </div>
          </div>

          {/* Render console pipeline terminal logs */}
          {status.log && (
            <div className="mt-4">
              <div className="flex items-center gap-2 bg-[#0d1117] text-slate-400 px-4 py-2 rounded-t-md border-b border-white/5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Migration Terminal Log Output</span>
              </div>
              <pre className="p-4 bg-[#090d13] text-emerald-450 border border-white/5 rounded-b-md text-[10px] font-mono leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap">
                {status.log}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Blueprint Reference Data Catalog mapping */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-brand-navy" />
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#002147] font-mono">
            Database Blueprint Requirements
          </h4>
        </div>
        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          The uploaded Access database must follow Philippine Public Sector Accounting Standards (PPSAS) and match LGU-Mambusao structural indexes. Ensure your Access database contains these exact table catalog names:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-150 rounded">
            <span className="font-mono text-xs font-bold text-brand-navy block mb-1">JEV</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Contains double-entry transaction headers (JEV_Number, Date, JEV_Type, Description, Payee, Check_Number, Check_Date, DV_Number).
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded">
            <span className="font-mono text-xs font-bold text-brand-navy block mb-1">JEVDetails</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Linked accounting entries holding transaction debits and credits correlated to account codes and responsibility center references.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded">
            <span className="font-mono text-xs font-bold text-brand-navy block mb-1">AC (Chart of Accounts)</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Official chart list (AC_Code, Title, Nature) organizing Balance Sheet, Income Statement, and Cash Flow classifications.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded">
            <span className="font-mono text-xs font-bold text-brand-navy block mb-1">RC (Responsibility Centers)</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Municipal organization offices mapping budgetary programs, executive programs, and social classifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
