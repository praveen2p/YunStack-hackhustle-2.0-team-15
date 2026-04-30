import { motion } from 'motion/react';
import { 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  History, 
  BarChart3, 
  Lock, 
  AlertTriangle,
  Server,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';


export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">System Governance</h1>
          <p className="text-slate-500 mt-1">Platform monitoring and compliance dashboard.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono">
          <Server className="h-4 w-4 text-emerald-500" />
          SYSTEM STATUS: OPTIMAL
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Patients', value: '42,912', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Verified Organizations', value: '1,842', icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Active Smart Tokens', value: '156K', icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Avg Extraction Time', value: '1.2s', icon: Activity, color: 'text-medical-600', bg: 'bg-medical-50' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
            <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Security Audit Feed</h3>
            <button 
              onClick={() => navigate('/admin/security')}
              className="text-xs font-bold text-medical-600 flex items-center gap-1 hover:underline"
            >
              View All Logs <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y">
              {[
                { action: 'Admin Privileged Access', user: 'root_admin', time: '2m ago', status: 'verified', color: 'text-emerald-500' },
                { action: 'Suspicious Auth Attempt', user: 'unknown_ip_88', time: '12m ago', status: 'blocked', color: 'text-rose-500' },
                { action: 'Database Index Rotation', user: 'sys_core', time: '44m ago', status: 'completed', color: 'text-blue-500' },
                { action: 'Bulk Export Request', user: 'dr_johnson_clinic', time: '1h ago', status: 'denied', color: 'text-rose-500' },
                { action: 'PKI Certificate Renewal', user: 'security_bot', time: '3h ago', status: 'completed', color: 'text-blue-500' },
              ].map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{log.action}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{log.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black uppercase tracking-tighter", log.color)}>{log.status}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-24 w-24" />
            </div>
            <h3 className="text-xl font-bold mb-6">Sensitive Operations</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <AlertTriangle className="h-8 w-8 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-slate-300">Evacuate Data Node</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <History className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-slate-300">Rollback Consensus</span>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Interoperability Health</h3>
            <div className="space-y-6">
              {[
                { name: 'FHIR R4 Gateway', usage: 88, status: 'Healthy' },
                { name: 'HL7 Legacy Bridge', usage: 42, status: 'Congested' },
                { name: 'OpenCV OCR Workers', usage: 12, status: 'Idle' },
              ].map((service, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">{service.name}</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                      service.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600' : 
                      service.status === 'Congested' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                    )}>{service.status}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      service.status === 'Healthy' ? 'bg-emerald-500 w-full' : 
                      service.status === 'Congested' ? 'bg-amber-500 w-1/2' : 'bg-slate-300 w-1/4'
                    )}></div>
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
