import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import { motion } from 'motion/react';
import { Stethoscope, Mail, Lock, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, error: authError } = useAuth();
  
  const role = (searchParams.get('role') || 'patient') as Role;
  const isRegister = searchParams.get('mode') === 'register';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isRegister) {
      setEmail('');
      return;
    }
    if (role === 'admin') setEmail('admin@memora.ai');
    else if (role === 'doctor') setEmail('dr.smith@hospital.com');
    else if (role === 'patient') setEmail('john.doe@email.com');
  }, [role, isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const authenticatedUser = isRegister
        ? await register(email, name, password, role, role !== 'patient' && role !== 'admin' ? role : undefined)
        : await login(email, password);
      setIsLoading(false);
      
      if (authenticatedUser.role === 'patient') {
        navigate('/face-auth');
      } else if (authenticatedUser.role === 'admin') {
        navigate('/admin');
      } else if (authenticatedUser.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/third-party');
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <button 
          onClick={() => navigate('/login-role')}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-medical-600 text-white shadow-lg mb-4">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 capitalize">{isRegister ? 'Create' : role} Portal</h2>
          <p className="mt-2 text-slate-500">{isRegister ? `Create a ${role} account to access your workspace.` : 'Enter your credentials to access your secure workspace.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 focus-within:text-medical-600 transition-colors">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 transition-all"
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 focus-within:text-medical-600 transition-colors">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 transition-all"
                placeholder="name@organization.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 focus-within:text-medical-600 transition-colors">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-medical-500 focus:ring-4 focus:ring-medical-50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {authError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {authError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-medical-600 focus:ring-medical-500" />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember session</span>
            </label>
            <a href="#" className="text-sm font-bold text-medical-600 hover:text-medical-700">Forgot password?</a>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="group w-full relative flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed mt-4 overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Initializing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isRegister ? 'Create Account' : 'Secure Login'}
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            )}
            {isLoading && (
              <motion.div 
                layoutId="loader"
                className="absolute inset-0 bg-medical-500/10 pointer-events-none"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            to={isRegister ? `/login?role=${role}` : `/login?role=${role}&mode=register`}
            className="font-bold text-slate-900 hover:text-medical-600"
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
