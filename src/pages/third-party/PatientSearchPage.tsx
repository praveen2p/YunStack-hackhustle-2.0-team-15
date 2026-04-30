import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  User, 
  Filter, 
  ArrowUpRight, 
  ChevronRight, 
  ShieldCheck,
  Activity,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { setSelectedPatientId } from '../../lib/selectedPatient';
import { MedicalRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function PatientSearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'doctor' ? '/doctor' : '/third-party';
  const [patientId, setPatientId] = useState('HP-PAT-DEMO');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setError(null);
    setSearched(true);
    try {
      setRecords(await orgAPI.searchPatient(patientId));
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Patient not found');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Patient Index</h1>
        <p className="text-slate-500 mt-1">Search and access patient healthcare records across the network.</p>
      </div>

      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Quick Search</label>
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
             <input 
               type="text" 
               value={patientId}
               onChange={(e) => setPatientId(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSearch();
               }}
               placeholder="Enter Patient ID..." 
               className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white focus:outline-none transition-all text-lg font-medium"
             />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
          >
            Search Patient Records
          </button>
          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          <p className="text-xs text-slate-400 font-medium">Use a valid Healthcare ID (HID) for cryptographically verified searches.</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Recent Searches</h3>
          <button className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
             <Filter className="h-3 w-3" /> Advanced Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4">Patient Identity</th>
                <th className="px-6 py-4">Birth Date</th>
                <th className="px-6 py-4">Network Status</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-6 py-4 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.length === 0 && !searched && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={5}>
                    Search a patient ID to load records.
                  </td>
                </tr>
              )}
              {records.length === 0 && searched && !error && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={5}>
                    ℹ️ No records found for patient {patientId}. Patient may not have any uploaded medical records yet.
                  </td>
                </tr>
              )}
              {records.length === 0 && error && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-rose-600" colSpan={5}>
                    ❌ {error}
                  </td>
                </tr>
              )}
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {record.title.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{record.title}</p>
                         <p className="text-[10px] text-slate-400 font-mono">HID: {patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-medium text-slate-600">{new Date(record.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                      record.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      record.status === 'archived' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                    )}>{record.status}</span>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500">{record.provider_name}</td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => {
                        setSelectedPatientId(patientId);
                        navigate(`${basePath}/history`);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Open History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
