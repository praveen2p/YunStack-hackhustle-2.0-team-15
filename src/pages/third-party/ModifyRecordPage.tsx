import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileEdit,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
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

export default function ModifyRecordPage() {
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
      setError('Select a record before submitting the modification request.');
      return;
    }

    if (!reason.trim()) {
      setError('Add a clinical reason for the requested modification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await orgAPI.requestModify(patientHpId.trim(), selectedRecord.id, reason.trim());
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modify request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <FileEdit className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Modify Clinical Record</h1>
          <p className="mt-1 text-slate-500">Request patient approval before revising an existing clinical record.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((item) => (
          <React.Fragment key={item}>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                step >= item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-400',
              )}
            >
              {item}
            </div>
            {item < 3 && <div className={cn('h-0.5 w-12 rounded-full', step > item ? 'bg-slate-900' : 'bg-slate-200')} />}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
                  className="w-full rounded-xl bg-slate-50 py-4 pl-12 pr-4 font-medium outline-none transition-all focus:ring-2 focus:ring-medical-500/20"
                />
              </div>
              <button
                type="button"
                onClick={searchPatient}
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find Records
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="record-request"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
          >
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                  <ClipboardList className="h-5 w-5 text-slate-400" /> Select Record
                </h3>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  Patient: {patientHpId.trim()}
                </span>
              </div>

              <div className="space-y-3">
                {activeRecords.length === 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    No editable records found for this patient.
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
                        isSelected ? 'border-amber-300 bg-amber-50' : 'border-slate-100 hover:border-medical-200 hover:bg-medical-50/30',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isSelected ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
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
                      {isSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-600" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-bold text-slate-900">Modification Details</h3>

              {selectedRecord ? (
                <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-700">Selected Record</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{selectedRecord.title}</p>
                  <p className="mt-1 text-xs text-slate-600">Record #{selectedRecord.id}</p>
                </div>
              ) : (
                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Choose a record from the list to continue.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical reason</label>
                <textarea
                  rows={6}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Example: Correct diagnosis text, update dosage, or add missing clinical context..."
                  className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:ring-2 focus:ring-medical-500/20"
                />
              </div>

              <div className="mt-5 flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-xs font-medium leading-relaxed text-amber-700">
                  This creates a consent request only. The record is not changed until the patient approves it.
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
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
              <ShieldCheck className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Request Sent</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              The modification request is awaiting patient consent. You can track the approval status from Consent Status.
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
