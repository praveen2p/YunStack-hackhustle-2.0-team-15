import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Mail, 
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

const users = [
  { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Patient', status: 'Active', joined: 'Oct 24, 2023' },
  { id: '2', name: 'Dr. Robert Wilson', email: 'robert.w@cityhospital.org', role: 'Doctor', status: 'Active', joined: 'Nov 12, 2023' },
  { id: '3', name: 'John Doe', email: 'john.doe@example.com', role: 'Patient', status: 'Suspended', joined: 'Jan 05, 2024' },
  { id: '4', name: 'Sara Connor', email: 'sara.c@labspecialists.com', role: 'Lab Tech', status: 'Active', joined: 'Feb 18, 2024' },
  { id: '5', name: 'Mike Ross', email: 'mike.ross@legalhealth.com', role: 'Third-Party', status: 'Pending', joined: 'Mar 10, 2024' },
];

export default function UserManagementPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-slate-500 mt-1">Manage system users, roles, and account permissions.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm text-sm">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-medical-600 text-white font-bold text-sm shadow-lg shadow-medical-600/20 hover:bg-medical-700 transition-colors">
            Add New User
          </button>
        </div>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-medical-600 transition-colors">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Shield className="h-3 w-3 text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {user.joined}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      user.status === 'Suspended' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    )}>
                      {user.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : 
                       user.status === 'Suspended' ? <XCircle className="h-3 w-3" /> : null}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50/50 border-t flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Showing 5 of 12,942 users</p>
          <div className="flex gap-2">
             <button className="px-3 py-1 rounded-lg border bg-white text-xs font-bold text-slate-600 disabled:opacity-50" disabled>Previous</button>
             <button className="px-3 py-1 rounded-lg border bg-white text-xs font-bold text-slate-600">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
