import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Lock, 
  MapPin, 
  Globe, 
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

const securityEvents = [
  { id: '1', level: 'High', threat: 'Brute Force Attempt', origin: '192.168.1.45 (Russia)', timestamp: '2024-04-29 11:05:00', status: 'Blocked', action: 'Blacklisted IP' },
  { id: '2', level: 'Medium', threat: 'Unauthorized SQL Injection', origin: '10.0.4.22 (Proxied)', timestamp: '2024-04-29 10:44:12', status: 'Quarantined', action: 'WAF Filtered' },
  { id: '3', level: 'Low', threat: 'Abnormal Session Duration', origin: 'Dr. Sarah (San Jose, CA)', timestamp: '2024-04-29 09:30:15', status: 'Monitoring', action: 'Alert Sent' },
  { id: '4', level: 'High', threat: 'Mass Record Export', origin: 'Internal (Root_Admin)', timestamp: '2024-04-29 08:22:00', status: 'Pending', action: 'Require MFA' },
];

export default function SecurityLogsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Security & Intrusion Logs</h1>
        <p className="text-slate-500 mt-1">Platform threat detection and incident response management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-3xl bg-rose-600 text-white shadow-xl shadow-rose-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-white/20 rounded-lg">
                <ShieldAlert className="h-6 w-6" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Active Alerts</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold">12</h3>
            <p className="text-sm font-medium opacity-80">Security incidents flagged this hour</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-white/20 rounded-lg">
                <Lock className="h-6 w-6" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Encryption Health</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold">99.8%</h3>
            <p className="text-sm font-medium opacity-80">Payload integrity verification rate</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-slate-100 rounded-lg text-medical-600">
                <Zap className="h-6 w-6" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded">WAF Status</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">Optimal</h3>
            <p className="text-sm font-medium text-slate-400">Layer 7 firewall is active and clearing</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <AlertTriangle className="h-5 w-5 text-amber-500" />
             <h3 className="font-bold text-slate-900">Threat Intelligence Feed</h3>
          </div>
          <button className="text-xs font-bold text-medical-600 hover:underline">Download PCAP Dump</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">Threat Type</th>
                <th className="px-6 py-4">Origin / Identity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Auto-Action</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {securityEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        event.level === 'High' ? 'bg-rose-500 animate-pulse' : 
                        event.level === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                      )}></div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{event.threat}</p>
                         <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Severity: {event.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <Globe className="h-3 w-3 text-slate-400" />
                       <span className="text-xs font-medium text-slate-600">{event.origin}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      event.status === 'Blocked' ? 'bg-rose-50 text-rose-600' : 
                      event.status === 'Quarantined' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    )}>{event.status}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-500 italic">{event.action}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-xs font-mono text-slate-400">{event.timestamp.split(' ')[1]}</p>
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
