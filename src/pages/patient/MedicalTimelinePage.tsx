import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  FileText, 
  Activity, 
  Pill, 
  Stethoscope, 
  Hospital,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { patientAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';

export default function MedicalTimelinePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientAPI.getTimeline()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load timeline'));
  }, []);

  const timelineEvents = useMemo(() => {
    const visualFor = (type: MedicalRecord['type']) => {
      if (type === 'prescription') return { icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      if (type === 'consultation') return { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' };
      if (type === 'imaging') return { icon: Hospital, color: 'text-purple-600', bg: 'bg-purple-50' };
      if (type === 'lab') return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' };
      return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' };
    };

    const groups = records.reduce<Record<string, any[]>>((acc, record) => {
      const year = new Date(record.date).getFullYear().toString();
      acc[year] ||= [];
      acc[year].push({
        id: String(record.id),
        title: record.title,
        type: record.type,
        date: new Date(record.date).toLocaleDateString(),
        provider: record.provider_name,
        status: record.status,
        tags: [record.type, record.status],
        ...visualFor(record.type),
      });
      return acc;
    }, {});
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, events]) => ({ year, events }));
  }, [records]);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Longitudinal Timeline</h1>
          <p className="text-slate-500 mt-1">A chronological journey of your unified medical history.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-medical-500" />
            <input 
              type="text" 
              placeholder="Search timeline..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-50 text-sm w-full md:w-64 transition-all"
            />
          </div>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 hidden md:block md:-translate-x-1/2"></div>
        
        <div className="space-y-12">
          {timelineEvents.length === 0 && !error && (
            <div className="rounded-2xl border bg-white p-8 text-sm font-bold text-slate-500">No timeline records yet.</div>
          )}
          {timelineEvents.map((yearGroup) => (
            <div key={yearGroup.year} className="relative">
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -top-6 h-12 w-24 items-center justify-center rounded-full bg-slate-900 text-white font-display font-bold text-sm z-10 shadow-xl border-4 border-slate-50">
                {yearGroup.year}
              </div>
              <div className="md:hidden mb-6 inline-block rounded-lg bg-slate-900 px-4 py-1 text-white font-display font-bold text-xs uppercase tracking-widest">
                {yearGroup.year}
              </div>

              <div className="space-y-12 pt-8">
                {yearGroup.events.map((event, idx) => {
                  const EventIcon = event.icon;
                  const isEven = idx % 2 === 0;

                  return (
                    <div 
                      key={event.id}
                      className={`relative flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      {/* Event Dot on Timeline */}
                      <div className="absolute left-4 md:left-1/2 h-6 w-6 rounded-full border-4 border-slate-50 bg-medical-500 md:-translate-x-1/2 z-20 hidden md:block"></div>
                      
                      {/* Content Card */}
                      <motion.div 
                        initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full"
                      >
                        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-xl transition-shadow group cursor-pointer relative overflow-hidden">
                          {/* Accent Gradient */}
                          <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-8 -translate-y-8", event.bg)}></div>

                          <div className="flex items-start gap-4">
                            <div className={cn("h-12 w-12 rounded-xl shrink-0 flex items-center justify-center", event.bg, event.color)}>
                              <EventIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-400 capitalize">{event.type}</span>
                                <span className="text-xs font-medium text-slate-400">{event.date}</span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-medical-600 transition-colors">{event.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                {event.status === 'active' ? 'Active record' : event.status === 'pending' ? 'Awaiting approval' : 'Archived'}
                              </p>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {event.tags.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Stethoscope className="h-3 w-3 text-slate-400" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{event.provider}</span>
                                </div>
                                <button 
                                  onClick={() => navigate('/patient/records')}
                                  className="text-xs font-bold text-medical-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                                >
                                  View Records <ChevronRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Spacer for reverse layout */}
                      <div className="flex-1 hidden md:block"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 p-8 rounded-3xl bg-medical-500 text-white shadow-2xl shadow-medical-100 relative overflow-hidden text-center md:text-left">
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Need a clinical PDF summary?</h3>
            <p className="text-medical-50 leading-relaxed max-w-lg">Generate a standardized medical report for your next physical consultation with a single click.</p>
          </div>
          <button 
            onClick={() => navigate('/patient/summary')}
            className="whitespace-nowrap px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <FileText className="h-5 w-5" /> Generate Clinical Report
          </button>
        </div>
      </div>
    </div>
  );
}
