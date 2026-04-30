import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  X, 
  FileCheck, 
  Search, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function UploadRecordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'doctor' ? '/doctor' : '/third-party';
  const [files, setFiles] = useState<File[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'selection' | 'processing' | 'done'>('selection');
  const [currentProcess, setCurrentProcess] = useState('');
  const [patientId, setPatientId] = useState('HP-PAT-DEMO');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const startProcessing = () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    setUploadStep('processing');
    
    const steps = [
      'Initializing Secure OCR Tunnel...',
      'Segmenting Digital Artifacts (OpenCV)...',
      'Running TrOCR Neural Networks...',
      'Contextualizing Medical Terms (SciSpacy)...',
      'Structured Extraction (BioClinicalBERT)...',
      'Validating Metadata Invariants...',
      'Generating Patient Consent Request...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setCurrentProcess(steps[i]);
        i++;
      } else {
        clearInterval(interval);
        orgAPI.uploadDocument(patientId, 'auto', files[0])
          .then(() => setUploadStep('done'))
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploadStep('selection');
          })
          .finally(() => setIsUploading(false));
      }
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Record Upload Center</h1>
        <p className="text-slate-500 mt-1">Upload clinical documents to synchronize with the patient's longitudinal memory.</p>
      </div>

      {uploadStep === 'selection' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Patient Selection */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Step 1: Identify Patient</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-medical-500 transition-all font-mono"
                placeholder="Enter Patient ID (e.g. HP-2291)"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">Note: Clinical data will only be visible to patients after they approve the consent request generated upon upload.</p>
          </div>

          {/* Upload Area */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Step 2: Add Documents</h3>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-medical-300 transition-all cursor-pointer group"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input 
                id="file-input" 
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect}
              />
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-6">
                <Upload className="h-10 w-10 text-medical-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Drop files here or click to browse</h4>
              <p className="text-sm text-slate-400 mt-2">PDF, DICOM, images, or docx. Max 50MB per file.</p>
            </div>

            {files.length > 0 && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Selected Files</h4>
                  <button onClick={() => setFiles([])} className="text-xs font-bold text-rose-600 hover:underline">Clear all</button>
                </div>
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50/50">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            disabled={files.length === 0 || isUploading}
            onClick={startProcessing}
            className="w-full rounded-2xl bg-medical-600 py-5 text-lg font-bold text-white shadow-xl shadow-medical-100 hover:bg-medical-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            <BrainCircuit className="h-6 w-6 group-hover:animate-pulse" />
            Initialize AI Processing
          </button>
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}
        </motion.div>
      )}

      {uploadStep === 'processing' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border bg-white p-12 shadow-2xl text-center"
        >
          <div className="relative h-48 w-48 mx-auto mb-10 text-medical-600">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-4 border-medical-500 rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            ></motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="h-16 w-16 animate-pulse" />
            </div>
            
            {/* Pulsing rings */}
            <div className="absolute inset-[-20px] rounded-full border border-medical-500/20 animate-ping"></div>
          </div>

          <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Analyzing Medical Data</h2>
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-slate-500 h-6 font-mono text-sm uppercase tracking-widest">{currentProcess}</p>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-medical-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 11, ease: 'linear' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-10 border-t">
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-50 mx-auto flex items-center justify-center text-slate-400 mb-2">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400">ID Verification</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-medical-50 mx-auto flex items-center justify-center text-medical-500 mb-2 border border-medical-200">
                  <Database className="h-6 w-6" />
                </div>
                <p className="text-[10px] uppercase font-bold text-medical-600">Vector Storage</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-50 mx-auto flex items-center justify-center text-slate-400 mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Consent Guard</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {uploadStep === 'done' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border bg-white p-12 shadow-2xl text-center"
        >
          <div className="h-24 w-24 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-100 mb-8 scale-110">
            <FileCheck className="h-12 w-12" />
          </div>
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Processing Complete</h2>
          <p className="text-slate-500 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            Data has been extracted and a consent request has been sent to Patient <span className="text-medical-600 font-bold">{patientId}</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                setFiles([]);
                setUploadStep('selection');
              }}
              className="rounded-xl border-2 border-slate-200 px-8 py-3 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Upload Another
            </button>
            <button 
              onClick={() => navigate(basePath)}
              className="rounded-xl bg-slate-900 px-8 py-3 font-bold text-white shadow-xl transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              Back to Dashboard <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
