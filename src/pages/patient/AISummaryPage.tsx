import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  Activity,
  Pill,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../lib/api';
import { PatientAISummary } from '../../types';

export default function AISummaryPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PatientAISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getAISummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load AI summary'));
  }, []);

  const stableMetrics = summary?.stable_metrics ?? [];
  const medications = summary?.medications ?? [];
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">AI Clinical Synthesis</h1>
          <p className="text-slate-500 mt-1">A clear clinical view built from your uploaded medical records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all"
          >
            <Sparkles className="h-4 w-4" /> Regenerate Analysis
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border bg-white p-8 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 text-medical-200 group-hover:scale-110 transition-transform">
            <BrainCircuit className="h-24 w-24" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-medical-600 font-bold mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm uppercase tracking-widest">Clinical Summary</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display tracking-tight">
              {summary?.headline || 'Patient Health Status & Trend'}
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
              {(summary?.paragraphs ?? ['Loading patient synwhsis...']).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900">Stable Metrics</h3>
            </div>
            <ul className="space-y-4">
              {stableMetrics.length === 0 && (
                <li className="text-sm font-semibold text-slate-500">No extracted metrics yet.</li>
              )}
              {stableMetrics.map((item, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.label}</p>
                    <p className="font-bold text-slate-900 mt-1">{item.value}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Pill className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900">Medication Overview</h3>
            </div>
            <div className="space-y-4">
              {medications.length === 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">No medication profile extracted yet</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Upload more clinical records to enrich this view</p>
                </div>
              )}
              {medications.map((med, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">
                    {med.name} <span className="font-normal text-slate-500 text-xs">- {med.dose}</span>
                  </p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{med.purpose}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/patient/timeline')}
                className="w-full py-2 text-xs font-bold text-blue-600 hover:underline"
              >
                View Treatment History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
