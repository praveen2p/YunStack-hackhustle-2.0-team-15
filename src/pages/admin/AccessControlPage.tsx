import React from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  Key, 
  ShieldAlert, 
  UserPlus, 
  Settings2, 
  Eye, 
  Edit3, 
  Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AccessControlPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Access Control & IAM</h1>
        <p className="text-slate-500 mt-1">Configure role-based permissions and system-level security policies.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Active Roles</h3>
              <button className="text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">Create New Role</button>
            </div>
            <div className="divide-y">
              {[
                { name: 'Patient', users: 12402, permissions: 'Read/Write Own Data', icon: Lock, color: 'text-blue-500' },
                { name: 'Physician', users: 842, permissions: 'Read Records (Consented)', icon: Key, color: 'text-emerald-500' },
                { name: 'Lab Technician', users: 312, permissions: 'Write Test Results', icon: Edit3, color: 'text-purple-500' },
                { name: 'System Admin', users: 12, permissions: 'Full Governance', icon: ShieldAlert, color: 'text-rose-500' },
              ].map((role, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center ${role.color}`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{role.name}</p>
                      <p className="text-xs text-slate-500">{role.users} active users • {role.permissions}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl hover:bg-white border transparent hover:border-slate-200 transition-all text-slate-400">
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white shadow-sm p-8">
            <h3 className="font-bold text-slate-900 mb-6">Security Policy Templates</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-medical-200 hover:bg-medical-50/30 transition-all">
                <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-medical-600 mb-4">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">HIPAA Compliance Level 1</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Standard privacy controls for patient record indexing and access auditing.</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-medical-600">
                  Deploy Template <ChevronRight className="h-3 w-3" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600 mb-4">
                  <Lock className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Strict Zero-Trust Access</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Mandatory multi-step consent for all cross-organization document lookups.</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                  Deploy Template <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-slate-900 p-8 text-white">
            <h3 className="font-bold mb-6">Permission Logic</h3>
            <div className="space-y-4">
              {[
                { label: 'Auto-Revoke Access after 30 days', active: true },
                { label: 'Require Face ID for Admin Login', active: true },
                { label: 'Regional Data Locality Isolation', active: false },
                { label: 'Mask PII in Third-Party Queries', active: true },
              ].map((toggle, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="text-xs font-medium text-slate-300">{toggle.label}</span>
                  <div className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    toggle.active ? 'bg-medical-500' : 'bg-slate-700'
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      toggle.active ? 'left-4.5' : 'left-0.5'
                    )}></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl bg-white/10 border border-white/20 text-xs font-bold hover:bg-white/20 transition-colors">
              Commit Strategy Changes
            </button>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Resource Guard</h3>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2 text-rose-600 mb-2 font-bold text-xs uppercase tracking-tight">
                <AlertCircle className="h-4 w-4" /> Critical Alert
              </div>
              <p className="text-xs text-rose-600 leading-relaxed font-medium">
                4 API Gateway endpoints currently lack mandatory cryptographical signature verification.
              </p>
              <button className="mt-4 w-full py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
                Enforce Global Signatures
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
