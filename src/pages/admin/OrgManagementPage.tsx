import React from 'react';
import { motion } from 'motion/react';
import { 
  Stethoscope, 
  Search, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';

const organizations = [
  { id: '1', name: 'City General Hospital', type: 'Hospital', location: 'New York, NY', status: 'Verified', patients: '12,402', apiHealth: '99.9%' },
  { id: '2', name: 'Express Diagnostics', type: 'Laboratory', location: 'Austin, TX', status: 'Verified', patients: '3,150', apiHealth: '98.5%' },
  { id: '3', name: 'Green Valley Clinic', type: 'Clinic', location: 'Portland, OR', status: 'Pending', patients: '840', apiHealth: 'N/A' },
  { id: '4', name: 'Pioneer Pharmacy', type: 'Pharmacy', location: 'Chicago, IL', status: 'Verified', patients: '5,600', apiHealth: '99.2%' },
  { id: '5', name: 'Bay Area Med', type: 'Hospital', location: 'San Francisco, CA', status: 'Verified', patients: '8,201', apiHealth: '100%' },
];

export default function OrgManagementPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Organization Governance</h1>
          <p className="text-slate-500 mt-1">Manage healthcare providers and third-party data consumers.</p>
        </div>
        <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg">
          Onboard Organization
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orgs', value: '1,842', change: '+12% this month' },
          { label: 'Pending Verification', value: '48', change: '8 new today' },
          { label: 'Data Transactions', value: '2.4M', change: '+24% this week' },
          { label: 'API Availability', value: '99.98%', change: 'Stable' },
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-white shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{item.value}</h3>
            <p className="text-xs font-medium text-emerald-600 mt-1">{item.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden text-sm">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by organization name or location..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-medical-500/20 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors">Export Directory</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Records Managed</th>
                <th className="px-6 py-4">API Health</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-medical-50 flex items-center justify-center text-medical-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{org.name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <MapPin className="h-2.5 w-2.5" /> {org.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">{org.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full", org.status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-400')}></div>
                      <span className={cn("font-bold uppercase text-[10px]", org.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600')}>{org.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600">{org.patients}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[95%]"></div>
                       </div>
                       <span className="text-[10px] font-bold text-slate-500">{org.apiHealth}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-medical-600 font-bold hover:underline">Manage</button>
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
