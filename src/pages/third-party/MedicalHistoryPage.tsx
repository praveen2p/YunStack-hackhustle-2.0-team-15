import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orgAPI } from '../../lib/api';
import { getSelectedPatientId, setSelectedPatientId } from '../../lib/selectedPatient';
import { MedicalRecord } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatRecordContent(record: MedicalRecord): string {
  const rawContent = record.content?.trim();
  if (!rawContent) return 'No extracted clinical content is available for this record.';

  try {
    const parsed = JSON.parse(rawContent) as {
      summary?: string;
      risk?: string;
      confidence?: string;
      source_file?: string;
      structured_data?: Record<string, unknown>;
    };
    const structured = parsed.structured_data ?? {};
    const detailRows = Object.entries(structured).map(([key, value]) => {
      const label = key.replaceAll('_', ' ');
      const rendered = Array.isArray(value) ? value.join(', ') || 'None noted' : String(value ?? 'Not reported');
      return `${label}: ${rendered}`;
    });

    return [
      `Summary: ${parsed.summary || 'No summary available.'}`,
      `Risk level: ${parsed.risk || 'Unknown'}`,
      `Confidence: ${parsed.confidence || 'Not available'}`,
      `Source file: ${parsed.source_file || record.file_name || 'Unknown'}`,
      '',
      ...detailRows,
    ].join('\n');
  } catch {
    return rawContent;
  }
}

function statusStyle(status: MedicalRecord['status']) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

export default function MedicalHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'doctor' ? '/doctor' : '/third-party';
  const [patientId, setPatientId] = useState('');
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].label);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (targetPatientId = patientId) => {
    const normalizedPatientId = targetPatientId.trim();
    setError(null);
    setSelectedRecord(null);

    if (!normalizedPatientId) {
      setError('Enter a patient HP ID to load medical history.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await orgAPI.searchPatient(normalizedPatientId);
      setRecords(result);
      setPatientId(normalizedPatientId);
      setLoadedPatientId(normalizedPatientId);
      setSelectedPatientId(normalizedPatientId);
      if (result.length === 0) {
        setError('No records were found for this patient.');
      }
    } catch (err) {
      setRecords([]);
      setLoadedPatientId(null);
      setError(err instanceof Error ? err.message : 'Failed to load medical history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const selectedPatientId = getSelectedPatientId();
    if (selectedPatientId) {
      setPatientId(selectedPatientId);
      void loadHistory(selectedPatientId);
    }
  }, []);

  const filteredRecords = useMemo(() => {
    const selectedCategory = categories.find((category) => category.label === activeCategory) ?? categories[0];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => !selectedCategory.types || selectedCategory.types.includes(record.type))
      .filter((record) => {
        if (!normalizedSearch) return true;
        return [
          record.title,
          record.provider_name,
          record.type,
          record.status,
          record.file_name,
          record.date,
          formatDate(record.date),
          record.content,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [activeCategory, records, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Medical History</h1>
          <p className="mt-1 text-slate-500">
            {loadedPatientId ? `Read-only patient record view for HID: ${loadedPatientId}.` : 'Load a patient to review their read-only history.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <ShieldCheck className="h-3 w-3" /> Read-only access
          </div>
          <button
            onClick={() => navigate(`${basePath}/search`)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Patient Search
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-blue-50/60 p-4 text-sm text-blue-800 flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Doctors and connected organizations can review patient history here, but cannot edit records from this screen.</p>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Patient HP ID</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadHistory();
              }}
              placeholder="Enter patient HP ID, e.g. HP-PAT-1234"
              className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 font-medium outline-none transition-all focus:ring-2 focus:ring-medical-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => loadHistory()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Load History
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {loadedPatientId && (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.label)}
                aria-pressed={activeCategory === category.label}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  activeCategory === category.label ? 'bg-medical-600 text-white shadow-md shadow-medical-200' : 'border bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search history by title, provider, type, date, or extracted content..."
              className="w-full rounded-3xl border bg-white py-4 pl-12 pr-4 shadow-sm outline-none transition-all focus:ring-2 focus:ring-medical-500/20"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="divide-y">
              {isLoading && (
                <div className="flex items-center gap-3 p-6 text-sm font-bold text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-medical-600" />
                  Loading medical history...
                </div>
              )}

              {!isLoading && filteredRecords.length === 0 && (
                <div className="p-6 text-sm font-bold text-slate-500">
                  No records found{searchTerm.trim() || activeCategory !== 'All Records' ? ' for the selected filters.' : ' for this patient.'}
                </div>
              )}

              {!isLoading && filteredRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  className="group flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all group-hover:bg-medical-50 group-hover:text-medical-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{record.title}</p>
                      <p className="mt-1 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
                        {record.type} • {record.provider_name}
                      </p>
                      {record.file_name && <p className="mt-2 max-w-[280px] truncate text-xs font-semibold text-slate-500">{record.file_name}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-900">{formatDate(record.date)}</p>
                    <div className={cn('mt-1 inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase', statusStyle(record.status))}>
                      <CheckCircle2 className="h-2.5 w-2.5" /> {record.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900 font-display">{selectedRecord.title}</h2>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">
                  {selectedRecord.type} • {selectedRecord.provider_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close record preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase', statusStyle(selectedRecord.status))}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {selectedRecord.status}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
