import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Upload, 
  FileEdit, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  Stethoscope,
  TrendingUp,
  BrainCircuit,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { AuditLog, ConsentRequest, MedicalRecord } from '../../types';


export default function ThirdPartyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = user?.role === 'doctor' ? '/doctor' : '/third-party';
  const isDoctor = user?.role === 'doctor';
  const [dashboard, setDashboard] = useState<{
    stats: { total_patients: number; records_uploaded: number; pending_approval: number; approved_requests: number };
    recent_records: MedicalRecord[];
    recent_consents: ConsentRequest[];
    recent_audit: AuditLog[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orgAPI.getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, []);

  const stats = dashboard?.stats ?? {
    total_patients: 0,
    records_uploaded: 0,
    pending_approval: 0,
    approved_requests: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-medical-600 font-bold mb-1">
            <Stethoscope className="h-4 w-4" />
            <span className="text-xs uppercase tracking-widest">{user?.organization} Workspace</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            {isDoctor ? 'Doctor Dashboard' : 'Clinical Portal'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isDoctor
              ? 'Review patients, upload clinical notes, and track consent requests from one secure workspace.'
              : 'Manage patient records with AI-enhanced clinical precision.'}
          </p>
        </div>
        <button 
          onClick={() => navigate(`${basePath}/upload`)}
          className="flex items-center justify-center gap-2 rounded-xl bg-medical-600 px-6 py-3 font-bold text-white shadow-lg shadow-medical-100 hover:bg-medical-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" /> New Patient File
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Patients', value: String(stats.total_patients), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Records Uploaded', value: String(stats.records_uploaded), icon: Upload, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Pending Approval', value: String(stats.pending_approval), icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Approved Requests', value: String(stats.approved_requests), icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search & Recents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Patients</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by name or ID" 
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium outline-none focus:border-medical-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Last Visit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(dashboard?.recent_records ?? []).length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500" colSpan={4}>No uploaded records yet.</td>
                    </tr>
                  )}
                  {(dashboard?.recent_records ?? []).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                            {p.title.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Patient #{p.patient_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", p.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500')}></div>
                          <span className="text-xs font-semibold text-slate-600">{p.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`${basePath}/search`)}
                          className="text-xs font-bold text-medical-600 hover:bg-medical-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Search History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/50 border-t text-center">
              <button 
                onClick={() => navigate(`${basePath}/search`)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Show More Patients
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-rose-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-bold text-sm">Critical Consent Denials</h4>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  {stats.pending_approval} consent requests are waiting for patient action.
                </p>
                <button 
                  onClick={() => navigate(`${basePath}/delete-requests`)}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Review Denials
                </button>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-16 w-16 text-medical-600" />
              </div>
              <h4 className="font-bold text-sm mb-4">Clinical Productivity</h4>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-bold text-slate-900">+12%</span>
                <span className="text-emerald-500 text-xs font-bold mb-1.5 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> vs last month</span>
              </div>
              <p className="text-xs text-slate-500">HealPath AI saved 22 hours of manual data entry this week.</p>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-900 p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/5"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">AI Diagnostic Support</h3>
              <p className="text-xs text-indigo-200 leading-relaxed mb-6">
                Connect external EMR datasets to improve diagnosis accuracy using our federated learning model.
              </p>
              <div className="space-y-3">
                <button className="w-full rounded-xl bg-indigo-500 py-3 text-xs font-bold text-white hover:bg-indigo-400 transition-colors">
                  Configure Integration
                </button>
                <button className="w-full rounded-xl bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 transition-colors">
                  View API Docs
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Recent Activities</h3>
            <div className="space-y-6">
              {(dashboard?.recent_audit ?? []).length === 0 && (
                <p className="text-sm font-bold text-slate-500">No recent activity yet.</p>
              )}
              {(dashboard?.recent_audit ?? []).map((act, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i < 2 && <div className="absolute top-8 left-4 bottom-[-1.5rem] w-[1px] bg-slate-100"></div>}
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10",
                    act.action.includes('UPLOAD') ? 'bg-blue-50 text-blue-500' :
                    act.action.includes('MODIFY') ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                  )}>
                    {act.action.includes('UPLOAD') ? <Upload className="h-4 w-4" /> : 
                     act.action.includes('MODIFY') ? <FileEdit className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{act.action.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{act.details} • {new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate(`${basePath}/logs`)}
              className="mt-8 w-full py-2.5 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors"
            >
              View Activity Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
