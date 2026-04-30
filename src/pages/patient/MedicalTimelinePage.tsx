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
  Brain,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { patientAPI } from '../../lib/api';
import { MedicalRecord } from '../../types';

type TimelineEvent = {
  id: string;
  title: string;
  type: MedicalRecord['type'];
  date: string;
  rawDate: string;
  provider: string;
  status: MedicalRecord['status'];
  summary: string;
  risk?: string;
  metrics: string[];
  tags: string[];
  icon: typeof FileText;
  color: string;
  bg: string;
};

const recordTypes: Array<{ label: string; value: MedicalRecord['type'] | 'all' }> = [
  { label: 'All Types', value: 'all' },
  { label: 'Lab Reports', value: 'lab' },
  { label: 'Prescriptions', value: 'prescription' },
  { label: 'Imaging', value: 'imaging' },
  { label: 'Consultations', value: 'consultation' },
  { label: 'Vaccinations', value: 'vaccination' },
  { label: 'Discharge Notes', value: 'discharge' },
];

function visualFor(type: MedicalRecord['type']) {
  if (type === 'prescription') return { icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (type === 'consultation') return { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' };
  if (type === 'imaging') return { icon: Hospital, color: 'text-purple-600', bg: 'bg-purple-50' };
  if (type === 'lab') return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' };
  if (type === 'vaccination') return { icon: History, color: 'text-cyan-600', bg: 'bg-cyan-50' };
  return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' };
}

function parseRecordSnapshot(record: MedicalRecord) {
  const fallbackSummary = record.content?.trim().split('\n').find(Boolean) || 'No extracted clinical summary is available for this timeline item.';

  try {
    const parsed = JSON.parse(record.content || '{}') as {
      summary?: string;
      risk?: string;
      structured_data?: {
        glucose?: number | string | null;
        hba1c?: number | string | null;
        bp_sys?: number | string | null;
        bp_dia?: number | string | null;
        bmi?: number | string | null;
        cholesterol?: number | string | null;
        diagnosis?: string[];
        medications?: string[];
      };
    };
    const structured = parsed.structured_data ?? {};
    const metrics = [
      structured.glucose ? `Glucose ${structured.glucose}` : null,
      structured.hba1c ? `HbA1c ${structured.hba1c}` : null,
      structured.bp_sys ? `BP ${structured.bp_sys}${structured.bp_dia ? `/${structured.bp_dia}` : ''}` : null,
      structured.bmi ? `BMI ${structured.bmi}` : null,
      structured.cholesterol ? `Cholesterol ${structured.cholesterol}` : null,
      structured.diagnosis?.length ? structured.diagnosis.slice(0, 2).join(', ') : null,
      structured.medications?.length ? structured.medications.slice(0, 2).join(', ') : null,
    ].filter((item): item is string => Boolean(item));

    return {
      summary: parsed.summary || fallbackSummary,
      risk: parsed.risk,
      metrics,
    };
  } catch {
    return {
      summary: fallbackSummary,
      risk: undefined,
      metrics: [],
    };
  }
}

function statusLabel(status: MedicalRecord['status']) {
  if (status === 'active') return 'Active record';
  if (status === 'pending') return 'Awaiting approval';
  return 'Archived';
}

export default function MedicalTimelinePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<MedicalRecord['type'] | 'all'>('all');

  useEffect(() => {
    setIsLoading(true);
    patientAPI.getTimeline()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load timeline'))
      .finally(() => setIsLoading(false));
  }, []);

  const timelineEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const groups: Record<string, TimelineEvent[]> = records
      .filter((record) => activeType === 'all' || record.type === activeType)
      .map((record): TimelineEvent => {
        const snapshot = parseRecordSnapshot(record);
        return {
          id: String(record.id),
          title: record.title,
          type: record.type,
          date: new Date(record.date).toLocaleDateString(),
          rawDate: record.date,
          provider: record.provider_name,
          status: record.status,
          summary: snapshot.summary,
          risk: snapshot.risk,
          metrics: snapshot.metrics,
          tags: [record.type, record.status, ...(snapshot.risk ? [`${snapshot.risk} risk`] : [])],
          ...visualFor(record.type),
        };
      })
      .filter((event) => {
        if (!normalizedSearch) return true;
        return [
          event.title,
          event.type,
          event.date,
          event.provider,
          event.status,
          event.summary,
          event.risk,
          ...event.metrics,
        ].filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch);
      })
      .reduce<Record<string, TimelineEvent[]>>((acc, event) => {
      const year = new Date(event.rawDate).getFullYear().toString();
      acc[year] ||= [];
      acc[year].push(event);
      return acc;
    }, {});

    Object.values(groups).forEach((events) => {
      events.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    });

    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, events]) => ({ year, events }));
  }, [activeType, records, searchTerm]);

  const timelineStats = useMemo(() => {
    const years = new Set(records.map((record) => new Date(record.date).getFullYear()));
    return [
      { label: 'Records', value: records.length },
      { label: 'Active', value: records.filter((record) => record.status === 'active').length },
      { label: 'Years', value: years.size },
    ];
  }, [records]);

  const hasFilters = searchTerm.trim() || activeType !== 'all';

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Longitudinal Timeline</h1>
            <p className="text-slate-500 mt-1">A chronological journey of your unified medical history.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-80">
            {timelineStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-black tabular-nums text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search timeline by title, provider, metric, or date..." 
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm outline-none transition-all focus:border-medical-500 focus:bg-white focus:ring-4 focus:ring-medical-50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative md:w-56">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={activeType}
              onChange={(event) => setActiveType(event.target.value as MedicalRecord['type'] | 'all')}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm font-bold text-slate-600 outline-none transition-all focus:border-medical-500 focus:bg-white focus:ring-4 focus:ring-medical-50"
            >
              {recordTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="mt-4 h-6 w-2/3 rounded bg-slate-100" />
              <div className="mt-4 h-3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
      <div className="relative">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 hidden md:block md:-translate-x-1/2"></div>
        
        <div className="space-y-12">
          {timelineEvents.length === 0 && !error && (
            <div className="rounded-2xl border bg-white p-8 text-sm font-bold text-slate-500">
              {hasFilters ? 'No timeline records match the selected filters.' : 'No timeline records yet.'}
            </div>
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
                        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-xl transition-shadow group relative overflow-hidden">
                          {/* Accent Gradient */}
                          <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-8 -translate-y-8", event.bg)}></div>

                          <div className="flex items-start gap-4">
                            <div className={cn("h-12 w-12 rounded-xl shrink-0 flex items-center justify-center", event.bg, event.color)}>
                              <EventIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-xs font-bold text-slate-400 capitalize">{event.type}</span>
                                <span className="shrink-0 text-xs font-medium text-slate-400">{event.date}</span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-medical-600 transition-colors">{event.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed mb-4">{event.summary}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {event.tags.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              {event.metrics.length > 0 && (
                                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                                  {event.metrics.slice(0, 4).map((metric) => (
                                    <div key={metric} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                      {metric}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Stethoscope className="h-3 w-3 text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-tight">{event.provider}</p>
                                    <p className="text-[10px] font-semibold text-slate-400">{statusLabel(event.status)}</p>
                                  </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => navigate('/patient/records')}
                                  className="shrink-0 text-xs font-bold text-medical-600 flex items-center gap-1 group-hover:gap-2 transition-all"
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
      )}

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
            <Brain className="h-5 w-5" /> Generate Clinical Report
          </button>
        </div>
      </div>
    </div>
  );
}
