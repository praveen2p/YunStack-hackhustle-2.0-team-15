import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  FileEdit, 
  Trash2, 
  ChevronRight, 
  Search,
  Check,
  X,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../lib/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  path: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getNotifications()
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'));
  }, []);

  const getVisuals = (type: string) => {
    switch (type) {
      case 'upload': return { icon: Plus, color: 'bg-emerald-50 text-emerald-600', action: 'Review Request' };
      case 'modify': return { icon: FileEdit, color: 'bg-amber-50 text-amber-600', action: 'Review Request' };
      case 'delete': return { icon: Trash2, color: 'bg-rose-50 text-rose-600', action: 'Review Request' };
      default: return { icon: ShieldAlert, color: 'bg-blue-50 text-blue-600', action: 'View Details' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Security Alerts & Updates</h1>
          <p className="text-slate-500 mt-1">Real-time notifications regarding your data and system access.</p>
        </div>
        <button className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-2">
           <Check className="h-4 w-4" /> Mark all as read
        </button>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
           {error && <div className="p-8 text-sm font-bold text-rose-600">{error}</div>}
           {!error && notifications.length === 0 && <div className="p-8 text-sm font-bold text-slate-500">No notifications yet.</div>}
           {notifications.map((notif) => {
             const visual = getVisuals(notif.type);
             const Icon = visual.icon;
             return (
             <div key={notif.id} className={cn(
               "p-8 flex items-start gap-6 transition-all hover:bg-slate-50",
               notif.unread ? "bg-white" : "bg-white/50"
             )}>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0", visual.color)}>
                   <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-4 mb-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-900 truncate">{notif.title}</h3>
                        {notif.unread && <span className="h-1.5 w-1.5 rounded-full bg-medical-500 shadow-[0_0_8px_rgba(var(--medical-500),0.8)]"></span>}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleString()}</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mb-4 font-medium">{notif.description}</p>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => navigate(notif.path)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
                      >
                         {visual.action}
                      </button>
                      {notif.unread && (
                        <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                           Dismiss
                        </button>
                      )}
                   </div>
                </div>
             </div>
           )})}
        </div>
        <div className="p-6 bg-slate-50 border-t text-center">
           <button className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">Show Archive History</button>
        </div>
      </div>
    </div>
  );
}
