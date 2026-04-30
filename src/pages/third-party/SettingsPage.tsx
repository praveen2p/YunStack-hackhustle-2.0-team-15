import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Key,
  ChevronRight,
  Database,
  Cloud
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { orgAPI } from '../../lib/api';

export default function ThirdPartySettingsPage() {
  const { user, updateUser } = useAuth();
  const [organization, setOrganization] = useState(user?.organization || '');
  const [email, setEmail] = useState(user?.email || '');
  const [status, setStatus] = useState<string | null>(null);

  const saveProfile = async () => {
    setStatus(null);
    try {
      const updated = await orgAPI.updateProfile({ organization, email });
      updateUser(updated);
      setStatus('Organization profile updated.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to update organization profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Organization Profile</h1>
        <p className="text-slate-500 mt-1">Manage your professional identity and data access configuration.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
             <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-3xl bg-slate-900 flex items-center justify-center text-white mb-6 shadow-xl shadow-slate-200">
                   <Building2 className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 capitalize">{user?.role} Profile</h3>
                <p className="text-xs text-slate-500 mt-1">Organization ID: HID-ORG-4421</p>
                <div className="mt-6 w-full pt-6 border-t space-y-3">
                   <button className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">Update Branding</button>
                   <button className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Digital Certificate</button>
                </div>
             </div>
          </div>

          <div className="rounded-3xl border bg-slate-900 p-8 text-white">
             <h3 className="font-bold mb-6">Compliance Status</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                   <span className="text-xs font-medium text-slate-300">Identity Verified</span>
                   <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                   <span className="text-xs font-medium text-slate-300">HIPAA Certified</span>
                   <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-slate-300">GDPR Compliant</span>
                   <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50">
                 <h3 className="font-bold text-slate-900">Organization Metadata</h3>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formal Name</label>
                       <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-medical-500/20 outline-none text-sm font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Email</label>
                       <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-medical-500/20 outline-none text-sm font-medium" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry ID (NPID)</label>
                    <input type="text" defaultValue="USA-8822910" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-medical-500/20 outline-none text-sm font-mono" />
                 </div>
              </div>
           </div>

           <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-900">Infrastructure & API</h3>
                 <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Connected</span>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <Key className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">FHIR API Gateway</p>
                          <p className="text-xs text-slate-500 italic">Connected to v1.2 Protocol</p>
                       </div>
                    </div>
                    <button className="text-xs font-bold text-medical-600 hover:underline">Revoke Token</button>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <Database className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">Local Data Mirror</p>
                          <p className="text-xs text-slate-500 italic">Last sync: 12m ago</p>
                       </div>
                    </div>
                    <button className="text-xs font-bold text-medical-600 hover:underline">Force Sync</button>
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 mt-10">
              {status && <p className="mr-auto self-center text-sm font-bold text-slate-600">{status}</p>}
              <button className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold transition-colors">Discard</button>
              <button onClick={saveProfile} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200 transition-all hover:bg-slate-800">Update Governance Metadata</button>
           </div>
        </div>
      </div>
    </div>
  );
}
