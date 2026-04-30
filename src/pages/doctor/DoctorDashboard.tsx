import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  History,
  Loader2,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orgAPI } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { AuditLog, ConsentRequest, MedicalRecord } from '../../types';

type DoctorDashboardData = {
  stats: {
    total_patients: number;
    records_uploaded: number;
    pending_approval: number;
    approved_requests: number;
  };
  recent_records: MedicalRecord[];
  recent_consents: ConsentRequest[];
  recent_audit: AuditLog[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function recordTypeLabel(type: MedicalRecord['type']) {
  return type.replaceAll('_', ' ');
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DoctorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    orgAPI.getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load doctor dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = dashboard?.stats ?? {
    total_patients: 0,
    records_uploaded: 0,
    pending_approval: 0,
    approved_requests: 0,
  };
  const recentRecords = dashboard?.recent_records ?? [];
  const recentConsents = dashboard?.recent_consents ?? [];
  const recentAudit = dashboard?.recent_audit ?? [];
  const pendingConsents = recentConsents.filter((consent) => consent.status === 'pending');
  const approvalTotal = stats.pending_approval + stats.approved_requests;
  const approvalRate = approvalTotal > 0 ? Math.round((stats.approved_requests / approvalTotal) * 100) : 0;

  const filteredRecords = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return recentRecords;

    return recentRecords.filter((record) => {
      return [
        record.title,
        record.type,
        record.status,
        record.provider_name,
        String(record.patient_id),
      ].join(' ').toLowerCase().includes(normalized);
    });
  }, [recentRecords, searchTerm]);

  const statCards = [
    {
      title: 'Patients Seen',
      value: String(stats.total_patients),
      caption: 'Unique patients in your workspace',
      icon: Users,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Records Uploaded',
      value: String(stats.records_uploaded),
      caption: 'Clinical documents submitted',
      icon: FileText,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Pending Consent',
      value: String(stats.pending_approval),
      caption: 'Awaiting patient approval',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      caption: `${stats.approved_requests} approved requests`,
      icon: CheckCircle2,
      tone: 'bg-medical-50 text-medical-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-medical-600">
            <Stethoscope className="h-4 w-4" />
            {user?.organization || 'Clinical Workspace'}
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">Doctor Dashboard</h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Review patient records, manage consent-gated changes, and keep today&apos;s clinical work moving.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/doctor/search')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
            Find Patient
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor/upload')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-medical-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-medical-100 transition-colors hover:bg-medical-700"
          >
            <FilePlus2 className="h-4 w-4" />
            Upload Record
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-bold">Doctor dashboard could not be loaded.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-medical-600" />
          Loading doctor dashboard...
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}>
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.title === 'Pending Consent' && stats.pending_approval > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  Action
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{isLoading ? '--' : stat.value}</h3>
            <p className="mt-2 text-xs font-medium text-slate-400">{stat.caption}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Patient Worklist</h2>
                <p className="mt-1 text-xs text-slate-500">Recent records uploaded by your account.</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search records or patient ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium outline-none transition-colors focus:border-medical-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Record</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td className="px-5 py-8 text-sm font-bold text-slate-500" colSpan={5}>
                        {isLoading ? 'Loading patient records...' : 'No matching records found.'}
                      </td>
                    </tr>
                  )}
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-medical-50 text-medical-700">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Patient #{record.patient_id}</p>
                            <p className="text-[11px] font-mono text-slate-400">Provider: {record.provider_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">{record.title}</p>
                        <p className="text-xs capitalize text-slate-500">{recordTypeLabel(record.type)}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">{formatDate(record.date)}</td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                          record.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          record.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        )}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/doctor/history')}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-medical-700 transition-colors hover:bg-medical-50"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/doctor/modify')}
              className="rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Request Record Update</h3>
              <p className="mt-1 text-sm text-slate-500">Submit a consent-gated correction for an existing patient record.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/doctor/delete-requests')}
              className="rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Request Record Deletion</h3>
              <p className="mt-1 text-sm text-slate-500">Ask a patient to approve removal of outdated or incorrect data.</p>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-slate-900 p-5 text-white shadow-xl shadow-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Consent Worklist</h2>
                <p className="mt-1 text-xs text-slate-400">Requests needing patient response.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-medical-300" />
            </div>

            <div className="space-y-3">
              {pendingConsents.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold">No pending consent requests</p>
                  <p className="mt-1 text-xs text-slate-400">Your active requests are clear.</p>
                </div>
              )}
              {pendingConsents.slice(0, 3).map((consent) => (
                <div key={consent.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold capitalize">{consent.type} request</p>
                    <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{consent.reason}</p>
                  <p className="mt-3 text-[11px] font-mono text-slate-500">Patient #{consent.patient_id}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/doctor/consent')}
              className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-900 transition-colors hover:bg-slate-100"
            >
              View Consent Status
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Today&apos;s Shortcuts</h2>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
            <div className="grid gap-3">
              {[
                { label: 'Search patient by HP-ID', icon: Search, path: '/doctor/search' },
                { label: 'Upload clinical document', icon: FilePlus2, path: '/doctor/upload' },
                { label: 'Open medical history', icon: FileText, path: '/doctor/history' },
                { label: 'Review access logs', icon: History, path: '/doctor/logs' },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <action.icon className="h-4 w-4 text-medical-600" />
                    {action.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Activity</h2>
              <button
                type="button"
                onClick={() => navigate('/doctor/logs')}
                className="text-xs font-bold text-medical-700 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentAudit.length === 0 && (
                <p className="text-sm font-bold text-slate-500">No recent activity yet.</p>
              )}
              {recentAudit.slice(0, 4).map((audit) => (
                <div key={audit.id} className="flex gap-3">
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    audit.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    audit.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  )}>
                    <History className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{audit.action.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{audit.details}</p>
                    <p className="mt-1 text-[11px] font-mono text-slate-400">{formatTime(audit.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
