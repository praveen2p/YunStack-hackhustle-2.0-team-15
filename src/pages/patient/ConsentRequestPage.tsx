import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  User, 
  Trash2, 
  FileEdit, 
  PlusCircle, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Stethoscope,
  FlaskConical,
  Pill,
  Hospital
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { ConsentRequest } from '../../types';
import { patientAPI } from '../../lib/api';

export default function ConsentRequestPage() {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getConsentRequests()
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load consent requests'));
  }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setError(null);
    try {
      const updated = await patientAPI.actionConsentRequest(id, status);
      setRequests(prev => prev.map(req => req.id === id ? updated : req));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update consent request');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload': return PlusCircle;
      case 'modify': return FileEdit;
      case 'delete': return Trash2;
      default: return AlertCircle;
    }
  };

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'doctor': return Stethoscope;
      case 'lab': return FlaskConical;
      case 'pharmacist': return Pill;
      case 'clinic': return Hospital;
      default: return User;
    }
  };

  const filteredRequests = requests.filter(req => 
    activeTab === 'pending' ? req.status === 'pending' : req.status !== 'pending'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Consent Management</h1>
        <p className="text-slate-500 mt-1">Control who can access, modify, add, or permanently delete records in your medical memory.</p>
      </div>

      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('pending')}
          className={cn(
            "pb-4 px-6 text-sm font-bold transition-colors relative",
            activeTab === 'pending' ? "text-medical-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Active Requests
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
          {activeTab === 'pending' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-medical-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('resolved')}
          className={cn(
            "pb-4 px-6 text-sm font-bold transition-colors relative",
            activeTab === 'resolved' ? "text-medical-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          History
          {activeTab === 'resolved' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-medical-600" />}
        </button>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => {
              const ActionIcon = getIcon(req.type);
              const OrgIcon = getOrgIcon(req.organization_type);
              
              return (
                <motion.div 
                  key={req.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-2xl border bg-white p-6 shadow-sm group hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="shrink-0">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                        req.type === 'upload' ? 'bg-blue-500 shadow-blue-100' :
                        req.type === 'modify' ? 'bg-amber-500 shadow-amber-100' : 'bg-rose-500 shadow-rose-100'
                      )}>
                        <ActionIcon className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                              {req.type}
                            </span>
                            <span className="text-xs text-slate-400">{formatDate(req.timestamp)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {req.type === 'delete' ? 'Request to permanently delete record' : `Request to ${req.type} record`}
                          </h3>
                        </div>
                        {req.status !== 'pending' && (
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                          )}>
                            {req.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {req.status === 'approved' ? 'Approved' : 'Rejected'}
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-white border flex items-center justify-center text-slate-600">
                          <OrgIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.requester_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{req.organization_type}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-xl p-4 border border-dashed text-sm text-slate-600 italic">
                        "{req.reason}"
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button 
                            onClick={() => handleAction(req.id, 'approved')}
                            className="flex-1 rounded-xl bg-medical-500 py-3 text-sm font-bold text-white hover:bg-medical-700 shadow-lg shadow-medical-100 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {req.type === 'delete' ? 'Approve Permanent Delete' : 'Approve Action'}
                          </button>
                          <button 
                            onClick={() => handleAction(req.id, 'rejected')}
                            className="flex-1 rounded-xl bg-white border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle className="h-4 w-4" /> Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-full bg-white mx-auto flex items-center justify-center shadow-lg border mb-6">
                <ShieldCheck className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No {activeTab} requests found</h3>
              <p className="text-slate-500">All medical memory operations are currently secured and synchronized.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 rounded-xl bg-medical-500/20 border border-medical-500/30 flex items-center justify-center shrink-0">
          <Clock className="h-6 w-6 text-medical-400" />
        </div>
        <div>
          <h4 className="font-bold">Automated Grace Period</h4>
          <p className="text-sm text-slate-400">All approved modifications have a 48-hour revision window. You can undo any modification during this period if you detect inaccuracies.</p>
        </div>
        <button className="whitespace-nowrap px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold">
          Learn More
        </button>
      </div>
    </div>
  );
}
