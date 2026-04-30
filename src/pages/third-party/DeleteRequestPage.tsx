import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileX,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function DeleteRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'doctor' ? '/doctor' : '/third-party';
  const [step, setStep] = useState(1);
  const [patientHpId, setPatientHpId] = useState('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRecords = records.filter((record) => record.status !== 'archived');

  const searchPatient = async () => {
    const normalizedHpId = patientHpId.trim();
    setError(null);
    setSelectedRecord(null);

    if (!normalizedHpId) {
      setError('Enter a patient HP ID to find records.');
      return;
    }

    setIsSearching(true);
    try {
      const result = await orgAPI.searchPatient(normalizedHpId);
      setRecords(result);
      setStep(2);
      if (result.length === 0) {
        setError('No records were found for this patient.');
      }
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Patient search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const submitRequest = async () => {
    setError(null);

    if (!selectedRecord) {
      setError('Select a record before submitting the deletion request.');
      return;
    }

    if (!reason.trim()) {
      setError('Add a reason for the requested deletion.');
      return;
    }

    setIsSubmitting(true);
    try {
      await orgAPI.requestDelete(patientHpId.trim(), selectedRecord.id, reason.trim());
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
          <Trash2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Record Deletion Request</h1>
          <p className="mt-1 text-slate-500">Request patient approval before permanently deleting a clinical record.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-rose-900 p-6 text-white">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <ShieldAlert className="h-24 w-24" />
        </div>
        <div className="flex gap-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-rose-300" />
          <div className="max-w-2xl">
            <h3 className="mb-2 text-lg font-bold">Patient Consent Required</h3>
            <p className="text-sm leading-relaxed text-rose-100">
              This creates a permanent deletion consent request. The selected record remains unchanged unless the patient approves it.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((item) => (
          <React.Fragment key={item}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                step >= item ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-200 text-slate-400',
              )}
            >
              {item}
            </div>
            {item < 3 && <div className={cn('h-0.5 w-12 rounded-full', step > item ? 'bg-rose-600' : 'bg-slate-200')} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="patient-search"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="rounded-3xl border bg-white p-8 shadow-sm"
          >
            <h3 className="mb-6 flex items-center gap-2 font-bold text-slate-900">
              <User className="h-5 w-5 text-slate-400" /> Locate Patient
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={patientHpId}
                  onChange={(event) => setPatientHpId(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void searchPatient();
                  }}
                  placeholder="Enter patient HP ID, e.g. HP-PAT-1234"
                  className="w-full rounded-xl bg-slate-50 py-4 pl-12 pr-4 font-medium outline-none transition-all focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <button
                type="button"
                onClick={searchPatient}
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-rose-600/15 transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find Records
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="delete-request"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
          >
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                  <FileX className="h-5 w-5 text-slate-400" /> Select Record
                </h3>
                <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                  Patient: {patientHpId.trim()}
                </span>
              </div>

              <div className="space-y-3">
                {activeRecords.length === 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    No deletable records found for this patient.
                  </div>
                )}

                {activeRecords.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        'flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all',
                        isSelected ? 'border-rose-300 bg-rose-50' : 'border-slate-100 hover:border-rose-200 hover:bg-rose-50/30',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isSelected ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500')}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{record.title}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            #{record.id} • {record.type} • {formatDate(record.date)}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{record.provider_name}</p>
                        </div>
                      </div>
                      {isSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-rose-600" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-bold text-slate-900">Deletion Details</h3>

              {selectedRecord ? (
                <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-rose-700">Selected Record</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{selectedRecord.title}</p>
                  <p className="mt-1 text-xs text-slate-600">Record #{selectedRecord.id}</p>
                </div>
              ) : (
                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Choose a record from the list to continue.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Reason for deletion</label>
                <textarea
                  rows={6}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Example: Incorrect patient match, duplicate record, legal removal request..."
                />
              </div>

              <div className="mt-5 flex gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                <p className="text-xs font-medium leading-relaxed text-rose-700">
                  If the patient approves, this record and its attached document are permanently removed. Submit only when the selected record and reason are correct.
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSelectedRecord(null);
                    setError(null);
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 py-4 font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={isSubmitting || !selectedRecord}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 font-bold text-white shadow-lg shadow-rose-600/15 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Permanent Delete Request
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Request Sent</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              The permanent deletion request is awaiting patient consent. You can track the approval status from Consent Status.
            </p>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/consent`)}
              className="mt-8 rounded-2xl bg-medical-600 px-8 py-4 font-bold text-white shadow-xl shadow-medical-600/20 transition-all hover:bg-medical-700"
            >
              Track Consent Status
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
