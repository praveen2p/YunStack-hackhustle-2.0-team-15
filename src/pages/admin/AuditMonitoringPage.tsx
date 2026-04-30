import React from 'react';
import { motion } from 'motion/react';
import { 
  Eye, 
  Search, 
  Download, 
  Calendar, 
  User, 
  ShieldCheck, 
  Terminal,
  Activity,
  Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';

const auditLogs = [
  { id: '1', event: 'Patient Record Access', entity: 'P-9922', actor: 'Dr. Sarah Connor', org: 'City General', timestamp: '2024-04-29 08:32:11', status: 'Authorized' },
  { id: '2', event: 'Bulk Export Initiation', entity: 'System-wide', actor: 'Admin_Michael', org: 'Gov-Core', timestamp: '2024-04-29 07:15:00', status: 'Verified' },
  { id: '3', event: 'Consent Status Mutation', entity: 'P-1120', actor: 'Patient (Self)', org: 'Direct', timestamp: '2024-04-29 06:44:22', status: 'Success' },
  { id: '4', event: 'API Key Rotation', entity: 'Express-Labs', actor: 'Express-Bot', org: 'Express-Labs', timestamp: '2024-04-29 04:00:00', status: 'Auto-Task' },
  { id: '5', event: 'Suspicious Filter Pattern', entity: 'Records-API', actor: 'Unknown (IP: 92.112...)', org: 'N/A', timestamp: '2024-04-29 01:22:15', status: 'Mitigated' },
];

export default function AuditMonitoringPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Audit Monitoring</h1>
          <p className="text-slate-500 mt-1">Real-time immutable audit trail for all platform interactions.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm">
            <Download className="h-4 w-4" /> Export CSR Report
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {[
          { label: 'Event Throughput', value: '1.2M/day', icon: Activity, color: 'text-blue-600' },
          { label: 'Latency (Audit Write)', value: '18ms', icon: Terminal, color: 'text-emerald-600' },
          { label: 'Flagged Interactions', value: '42', icon: ShieldCheck, color: 'text-rose-600' },
          { label: 'Compliance Index', value: '100%', icon: Eye, color: 'text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-lg bg-slate-50", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-slate-900 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="font-bold text-white">Live System Stream</h3>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Query stream by entity..." 
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500/50 outline-none"
                />
             </div>
             <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-white/10 text-[10px] uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Event Description</th>
                <th className="px-6 py-4">Security Principal</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-medical-400 font-mono text-xs">
                        {log.id.padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{log.event}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Entity: {log.entity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-300">{log.actor}</p>
                    <p className="text-[10px] text-slate-500">{log.org}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono text-slate-400">{log.timestamp}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest",
                      log.status === 'Mitigated' ? 'bg-rose-500/20 text-rose-400' : 
                      log.status === 'Authorized' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    )}>{log.status}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span className="text-[10px] font-bold">SHA-256 Verified</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-white/5 text-center">
           <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Load Historical Archives</button>
        </div>
      </div>
    </div>
  );
}
