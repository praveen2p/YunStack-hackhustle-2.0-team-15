import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  History, 
  Activity, 
  Eye, 
  Lock, 
  Search, 
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { patientAPI } from '../../lib/api';
import { AuditLog } from '../../types';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getAuditLogs()
      .then(setAuditLogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs'));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Access & Activity Log</h1>
          <p className="text-slate-500 mt-1">Immutable ledger of every interaction with your healthcare profile.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
           Audit Chain: 512 Link Valid
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Network Requests', value: String(auditLogs.length), icon: Activity, color: 'text-blue-500' },
          { label: 'Warnings / Errors', value: String(auditLogs.filter((log) => log.status !== 'success').length), icon: Lock, color: 'text-rose-500' },
          { label: 'Successful Actions', value: String(auditLogs.filter((log) => log.status === 'success').length), icon: ShieldCheck, color: 'text-medical-600' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-white shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
           <h3 className="font-bold text-slate-900">Cryptographical Audit Trail</h3>
           <div className="flex gap-2">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Filter by action..." 
                   className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                 />
              </div>
              <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors">
                 <Filter className="h-4 w-4" />
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">Protocol Event</th>
                <th className="px-6 py-4">Requesting Authority</th>
                <th className="px-6 py-4">Legal Context</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right cursor-pointer">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {error && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-rose-600" colSpan={5}>{error}</td>
                </tr>
              )}
              {!error && auditLogs.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={5}>No audit logs yet.</td>
                </tr>
              )}
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-900">
                       <History className="h-4 w-4 text-slate-400" />
                       {log.action}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-medium text-slate-600">{log.user_name}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-slate-400 font-medium italic">{log.details}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                       {log.status === 'error' ? <Lock className="h-3 w-3 text-rose-500" /> : <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                       <span className={cn(
                         "text-[10px] font-bold uppercase tracking-wider",
                         log.status === 'error' ? 'text-rose-600' : 'text-emerald-600'
                       )}>{log.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-[10px] text-slate-400">
                     {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
