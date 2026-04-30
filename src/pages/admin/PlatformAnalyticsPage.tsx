import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Zap, 
  BrainCircuit, 
  Database,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../../lib/utils';

const data = [
  { name: 'Mon', usage: 4000, ai: 2400 },
  { name: 'Tue', usage: 3000, ai: 1398 },
  { name: 'Wed', usage: 2000, ai: 9800 },
  { name: 'Thu', usage: 2780, ai: 3908 },
  { name: 'Fri', usage: 1890, ai: 4800 },
  { name: 'Sat', usage: 2390, ai: 3800 },
  { name: 'Sun', usage: 3490, ai: 4300 },
];

const orgData = [
  { name: 'Hospitals', value: 45 },
  { name: 'Clinics', value: 30 },
  { name: 'Labs', value: 15 },
  { name: 'Pharmacies', value: 10 },
];

export default function PlatformAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Global healthcare data exchange and processing metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total API Requests', value: '1.4M', trend: '+12.5%', isUp: true, icon: Zap, color: 'text-amber-500' },
          { label: 'Active Data Streams', value: '8,242', trend: '+2.1%', isUp: true, icon: Activity, color: 'text-medical-600' },
          { label: 'AI Summaries Generated', value: '15.6K', trend: '-4.3%', isUp: false, icon: BrainCircuit, color: 'text-purple-600' },
          { label: 'Storage Used', value: '1.2 PB', trend: '+8.4%', isUp: true, icon: Database, color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl bg-slate-50", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded",
                stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}>
                {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Traffic Distribution</h3>
            <select className="bg-slate-50 border-none rounded-lg text-xs font-bold px-3 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="usage" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
           <h3 className="font-bold text-slate-900 mb-8">Org Type Split</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#1e293b'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {orgData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-4">
              {orgData.map((org, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'][i])}></div>
                      <span className="text-xs font-bold text-slate-600">{org.name}</span>
                   </div>
                   <span className="text-xs font-mono font-black text-slate-900">{org.value}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
