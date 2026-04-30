import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  BrainCircuit,
  History,
  Loader2
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { patientAPI } from '../../lib/api';
import { AuditLog, ConsentRequest, MedicalRecord } from '../../types';

type PatientDashboardData = {
  stats: { total_records: number; pending_consents: number; active_access: number; health_score: number };
  recent_records: MedicalRecord[];
  pending_consents: ConsentRequest[];
  recent_audit?: AuditLog[];
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}



export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<PatientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = dashboard?.stats ?? {
    total_records: 0,
    pending_consents: 0,
    active_access: 0,
    health_score: 0,
  };
  const recentRecords = dashboard?.recent_records ?? [];
  const pendingConsents = dashboard?.pending_consents ?? [];
  const recentAudit = dashboard?.recent_audit ?? [];

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{getGreeting()}, {user?.name}</h1>
          <p className="text-slate-500 mt-1">Your records, consent requests, and health signals are ready.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> System Verified
          </div>
          <div className="text-xs text-slate-400 font-mono">ID: {user?.hp_id || 'Pending'}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-bold">Dashboard could not be loaded.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-sm font-bold text-slate-500 shadow-sm flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-medical-600" />
          Loading patient dashboard...
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Records', value: String(stats.total_records), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Pending Consents', value: String(stats.pending_consents), icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', alert: stats.pending_consents > 0 },
          { title: 'Active Access', value: String(stats.active_access), icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4 }}
            className="rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.alert && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '--' : stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Records Column */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="rounded-2xl border bg-white p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Records</h3>
              <Link to="/patient/records" className="text-xs font-bold text-medical-600 hover:underline">View All</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentRecords.length === 0 && (
                <div className="text-sm font-bold text-slate-500">No records yet.</div>
              )}
              {recentRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => navigate('/patient/records')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors text-left w-full"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{record.title}</h4>
                    <p className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()} • {record.provider_name}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Column */}
        <div className="space-y-6">
          {/* Notifications / Consents */}
          <div className="rounded-2xl border bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Action Center</h3>
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {pendingConsents.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold">No pending consent requests</h4>
                  <p className="text-xs text-slate-400 mt-1">Your medical data is synchronized.</p>
                </div>
              ) : (
              <div
                onClick={() => navigate('/patient/consent')}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-medical-500/20 flex items-center justify-center text-medical-400">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{pendingConsents[0]?.type} Request</h4>
                    <p className="text-xs text-slate-400 mt-1">{pendingConsents[0]?.reason}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="rounded-lg bg-medical-500 px-3 py-1 text-[10px] font-bold text-white hover:bg-medical-600 transition-colors">Review</button>
                    </div>
                  </div>
                </div>
              </div>
              )}
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 opacity-80">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <History className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">
  {recentAudit[0]?.action
    ? recentAudit[0].action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
    : 'No recent audit activity'}
</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
  {recentAudit[0]?.details || 'Security and access events will appear here.'}
</p>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/patient/notifications')}
              className="mt-6 w-full text-center text-xs font-bold text-medical-400 flex items-center justify-center gap-1 group"
            >
              View All Notifications <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BrainCircuit className="h-24 w-24" />
            </div>
            <h3 className="font-bold text-slate-900 mb-4">AI Risk Overview</h3>
            <div className="p-4 rounded-xl bg-medical-50 border border-medical-100 text-medical-700">
              <div className="flex items-start gap-3">
                <BrainCircuit className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Predictive analysis available</h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    Review model-generated risk scores and explainable signals from your active medical records.
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/patient/risk')}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              View Risk Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
