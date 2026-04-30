import { motion } from 'motion/react';
import { Stethoscope, Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function DashboardNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const initials = (user?.name || user?.email || 'U')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <Stethoscope className="h-6 w-6 text-medical-600" />
          <span className="font-display text-xl font-bold tracking-tight">HealPath</span>
        </div>
        
        <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 lg:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search records, patients..." 
            className="bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 hover:bg-slate-100">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-medical-50 text-xs font-black text-medical-700 transition-colors hover:border-medical-500"
              aria-expanded={isProfileOpen}
              aria-label="Open profile menu"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
              ) : (
                initials || <User className="h-4 w-4" />
              )}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border bg-white p-1 shadow-lg">
              <button 
                onClick={() => {
                  const path = user?.role === 'patient' ? '/patient/settings' : 
                               user?.role === 'admin' ? '/admin/settings' :
                               user?.role === 'doctor' ? '/doctor/settings' : '/third-party/settings';
                  setIsProfileOpen(false);
                  navigate(path);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <User className="h-4 w-4" /> Profile Settings
              </button>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                  navigate('/');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
