import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { patientAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';

type RecordCategory = {
  label: string;
  types: MedicalRecord['type'][] | null;
};

const categories: RecordCategory[] = [
  { label: 'All Records', types: null },
  { label: 'Lab Reports', types: ['lab'] },
  { label: 'Imaging', types: ['imaging'] },
  { label: 'Prescriptions', types: ['prescription'] },
  { label: 'Clinical Notes', types: ['consultation', 'discharge', 'vaccination'] },
];

function formatRecordContent(record: MedicalRecord): string {
  const rawContent = record.content?.trim();
  if (!rawContent) {
    return 'No extracted clinical content is available for this record.';
  }

  try {
    const parsed = JSON.parse(rawContent) as {
      summary?: string;
      risk?: string;
      confidence?: string;
      source_file?: string;
      structured_data?: {
        age?: number | null;
        glucose?: number | null;
        bp_sys?: number | null;
        bp_dia?: number | null;
        hba1c?: number | null;
        cholesterol?: number | null;
        bmi?: number | null;
        diagnosis?: string[];
        medications?: string[];
      };
    };

    const structured = parsed.structured_data ?? {};
    const renderValue = (value: unknown, emptyLabel = 'Not reported') => {
      if (value === null || value === undefined || value === '') return emptyLabel;
      if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'None noted';
      return String(value);
    };

    return [
      `Summary: ${parsed.summary || 'No summary available.'}`,
      `Risk level: ${parsed.risk || 'Unknown'}`,
      `Confidence: ${parsed.confidence || 'Not available'}`,
      `Source file: ${parsed.source_file || record.file_name || 'Unknown'}`,
      '',
      'Clinical details',
      `Age: ${renderValue(structured.age)}`,
      `Glucose: ${renderValue(structured.glucose)}`,
      `Blood pressure (systolic): ${renderValue(structured.bp_sys)}`,
      `Blood pressure (diastolic): ${renderValue(structured.bp_dia)}`,
      `HbA1c: ${renderValue(structured.hba1c)}`,
      `Cholesterol: ${renderValue(structured.cholesterol)}`,
      `BMI: ${renderValue(structured.bmi)}`,
      `Diagnoses: ${renderValue(structured.diagnosis, 'None noted')}`,
      `Medications: ${renderValue(structured.medications, 'None noted')}`,
    ].join('\n');
  } catch {
    return rawContent;
  }
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].label);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getRecords()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load records'));
  }, []);

  const pendingRecords = records.filter((record) => record.status === 'pending');
  const visibleRecords = useMemo(() => {
    const selectedCategory = categories.find((category) => category.label === activeCategory) ?? categories[0];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => record.status !== 'archived')
      .filter((record) => !selectedCategory.types || selectedCategory.types.includes(record.type))
      .filter((record) => {
        if (!normalizedSearch) return true;

        const searchable = [
          record.title,
          record.provider_name,
          record.type,
          record.status,
          record.file_name,
          record.date,
          new Date(record.date).toLocaleDateString(),
          record.content,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      });
  }, [activeCategory, records, searchTerm]);

  const getStatusStyle = (status: MedicalRecord['status']) => {
    if (status === 'active') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-500';
  };

  const getStatusIcon = (status: MedicalRecord['status']) => {
    if (status === 'active') return CheckCircle2;
    if (status === 'pending') return Clock;
    return AlertCircle;
  };

  const downloadOriginalFile = async (record: MedicalRecord) => {
    try {
      const blob = await patientAPI.downloadRecordFile(record.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = record.file_name || `record-${record.id}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Medical Records</h1>
          <p className="text-slate-500 mt-1">Your secured health documentation, including records awaiting your consent.</p>
        </div>
      </div>

      {pendingRecords.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-800">Doctor upload awaiting consent</h2>
              <p className="mt-1 text-sm font-medium text-amber-700">
                {pendingRecords.length} uploaded document{pendingRecords.length === 1 ? '' : 's'} will become active after approval.
              </p>
            </div>
          </div>
          <Link
            to="/patient/consent"
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors"
          >
            Review Consent
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button 
            key={category.label}
            type="button"
            onClick={() => setActiveCategory(category.label)}
            aria-pressed={activeCategory === category.label}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeCategory === category.label ? "bg-medical-600 text-white shadow-md shadow-medical-200" : "bg-white border text-slate-500 hover:bg-slate-50"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search records by name, provider, or date..." 
                className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white border shadow-sm focus:ring-2 focus:ring-medical-500/20 outline-none transition-all"
              />
           </div>

           <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
              <div className="divide-y">
                 {error && (
                   <div className="p-6 text-sm font-bold text-rose-600">{error}</div>
                 )}
                 {!error && visibleRecords.length === 0 && (
                   <div className="p-6 text-sm font-bold text-slate-500">
                     No medical records found{searchTerm.trim() || activeCategory !== 'All Records' ? ' for the selected filters.' : '.'}
                   </div>
                 )}
                 {visibleRecords.map((record) => {
                   const StatusIcon = getStatusIcon(record.status);
                   return (
                   <div key={record.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-medical-600 group-hover:bg-medical-50 transition-all">
                           <FileText className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="font-bold text-slate-900">{record.title}</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">{record.type} • {record.provider_name}</p>
                           {record.file_name && (
                             <p className="mt-2 text-xs font-semibold text-slate-500 truncate max-w-[260px]">{record.file_name}</p>
                           )}
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                           <p className="text-xs font-bold text-slate-900">{new Date(record.date).toLocaleDateString()}</p>
                           <div className={cn("mt-1 inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase", getStatusStyle(record.status))}>
                              <StatusIcon className="h-2.5 w-2.5" /> {record.status}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                             onClick={() => setSelectedRecord(record)}
                             className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 text-slate-400 hover:text-medical-600 transition-all"
                             aria-label={`View ${record.title}`}
                           >
                              <Eye className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                   </div>
                 )})}
              </div>
              <div className="px-6 py-4 bg-slate-50/50 text-center border-t">
                 <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Show All Distributed Records</button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 rounded-3xl border bg-white shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 font-display uppercase tracking-widest text-xs">Record Categories</h3>
              <div className="space-y-4">
                 {[
                   { name: 'Laboratory Logs', count: records.filter((r) => r.type === 'lab').length, color: 'bg-emerald-500' },
                   { name: 'Imaging', count: records.filter((r) => r.type === 'imaging').length, color: 'bg-blue-500' },
                   { name: 'Consultations', count: records.filter((r) => r.type === 'consultation').length, color: 'bg-amber-500' },
                   { name: 'Medication History', count: records.filter((r) => r.type === 'prescription').length, color: 'bg-rose-500' },
                   { name: 'Awaiting Consent', count: pendingRecords.length, color: 'bg-amber-500' },
                 ].map((folder, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-medical-200 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                         <div className={cn("h-2 w-2 rounded-full", folder.color)}></div>
                         <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{folder.name}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-slate-400">{folder.count}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">{selectedRecord.title}</h2>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">
                  {selectedRecord.type} • {selectedRecord.provider_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close record preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase", getStatusStyle(selectedRecord.status))}>
                {React.createElement(getStatusIcon(selectedRecord.status), { className: "h-3.5 w-3.5" })}
                {selectedRecord.status === 'pending' ? 'Awaiting patient consent' : selectedRecord.status}
              </div>
              {selectedRecord.file_name && (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Uploaded document</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{selectedRecord.file_name}</p>
                </div>
              )}
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Extracted clinical content</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{formatRecordContent(selectedRecord)}</p>
              </div>
              {selectedRecord.status === 'pending' && (
                <Link
                  to="/patient/consent"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-medical-600 px-4 py-3 text-sm font-bold text-white hover:bg-medical-700 transition-colors"
                >
                  Approve or Reject Upload
                </Link>
              )}
              {selectedRecord.storage_key && (
                <button
                  onClick={() => downloadOriginalFile(selectedRecord)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download Original File
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
