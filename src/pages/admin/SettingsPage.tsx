import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Shield, 
  Bell, 
  User, 
  Globe, 
  Server, 
  Key, 
  Mail,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Configure global application behavior and administrative preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="space-y-1">
          {[
            { label: 'General', icon: User, active: true },
            { label: 'Security', icon: Shield, active: false },
            { label: 'Infrastructure', icon: Server, active: false },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Integrations', icon: Globe, active: false },
          ].map((item, i) => (
            <button 
              key={i} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                item.active ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-8 border-b">
              <h3 className="font-bold text-slate-900 mb-6">Administrative Profile</h3>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                   <User className="h-10 w-10" />
                </div>
                <div>
                   <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-colors">Change Avatar</button>
                   <p className="text-[10px] text-slate-400 mt-2">Recommended: 400x400px JPG/PNG</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input type="text" defaultValue="Root Administrator" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input type="email" defaultValue="admin@medical-pki.gov" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500/20 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Administrative Role</label>
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-600">
                   SuperUser (Read/Write/Delete/Govern)
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white shadow-sm p-8">
             <h3 className="font-bold text-slate-900 mb-8">Security Configuration</h3>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                         <Key className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">Multi-Factor Authentication</p>
                         <p className="text-[10px] text-slate-500">Currently enforced across all admin accounts.</p>
                      </div>
                   </div>
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                         <Shield className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">Session Hardware Key</p>
                         <p className="text-[10px] text-slate-500">Yubikey or Titan Security Key requirement.</p>
                      </div>
                   </div>
                   <button className="text-xs font-bold text-medical-600 hover:underline">Setup Key</button>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3">
             <button className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Discard</button>
             <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-colors">Save Global Metadata</button>
          </div>
        </div>
      </div>
    </div>
  );
}
