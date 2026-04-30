import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  BrainCircuit, 
  ShieldCheck, 
  History, 
  Bell, 
  Settings,
  Users,
  Search,
  PlusCircle,
  FileEdit,
  Trash2,
  Lock,
  Stethoscope,
  BarChart3,
  Activity
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const getLinks = () => {
    switch (user?.role) {
      case 'patient':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/patient' },
          { name: 'Medical Records', icon: FileText, path: '/patient/records' },
          { name: 'AI Summary', icon: BrainCircuit, path: '/patient/summary' },
          { name: 'Medical Timeline', icon: Clock, path: '/patient/timeline' },
          { name: 'Risk Analysis', icon: Activity, path: '/patient/risk' },
          { name: 'Consent Requests', icon: ShieldCheck, path: '/patient/consent' },
          { name: 'Audit Logs', icon: History, path: '/patient/audit' },
          { name: 'Notifications', icon: Bell, path: '/patient/notifications' },
          { name: 'Settings', icon: Settings, path: '/patient/settings' },
        ];
      case 'doctor':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/doctor' },
          { name: 'Patient Search', icon: Search, path: '/doctor/search' },
          { name: 'Upload Records', icon: PlusCircle, path: '/doctor/upload' },
          { name: 'Modify Records', icon: FileEdit, path: '/doctor/modify' },
          { name: 'Delete Requests', icon: Trash2, path: '/doctor/delete-requests' },
          { name: 'Medical History', icon: Clock, path: '/doctor/history' },
          { name: 'Consent Status', icon: ShieldCheck, path: '/doctor/consent' },
          { name: 'Access Logs', icon: History, path: '/doctor/logs' },
          { name: 'Settings', icon: Settings, path: '/doctor/settings' },
        ];
      case 'lab':
      case 'pharmacist':
      case 'clinic':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/third-party' },
          { name: 'Patient Search', icon: Search, path: '/third-party/search' },
          { name: 'Upload Records', icon: PlusCircle, path: '/third-party/upload' },
          { name: 'Modify Records', icon: FileEdit, path: '/third-party/modify' },
          { name: 'Delete Requests', icon: Trash2, path: '/third-party/delete-requests' },
          { name: 'Medical History', icon: Clock, path: '/third-party/history' },
          { name: 'Consent Status', icon: ShieldCheck, path: '/third-party/consent' },
          { name: 'Access Logs', icon: History, path: '/third-party/logs' },
          { name: 'Settings', icon: Settings, path: '/third-party/settings' },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
          { name: 'User Management', icon: Users, path: '/admin/users' },
          { name: 'Organizations', icon: Stethoscope, path: '/admin/orgs' },
          { name: 'Access Control', icon: Lock, path: '/admin/access' },
          { name: 'Audit Monitoring', icon: History, path: '/admin/audit' },
          { name: 'Security Logs', icon: History, path: '/admin/security' },
          { name: 'Platform Analytics', icon: BarChart3, path: '/admin/analytics' },
          { name: 'Settings', icon: Settings, path: '/admin/settings' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-600 text-white shadow-lg shadow-medical-200">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 leading-tight">HealPath AI</h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Medical Memory</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-medical-50 text-medical-700 shadow-sm shadow-medical-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-medical-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {link.name}
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-medical-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-medical-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-medical-400">Secure Node</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Your medical data is encrypted with 256-bit AES.</p>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-full bg-medical-500 opacity-80" />
          </div>
        </div>
      </div>
    </aside>
  );
}
