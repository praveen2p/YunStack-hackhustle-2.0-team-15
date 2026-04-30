import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { ConsentRequest } from '../../types';

const filters = ['all', 'pending', 'approved', 'rejected'] as const;
type StatusFilter = (typeof filters)[number];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function actionIcon(type: ConsentRequest['type']) {
  if (type === 'upload') return PlusCircle;
  if (type === 'modify') return FileEdit;
  return Trash2;
}

function statusConfig(status: ConsentRequest['status']) {
  if (status === 'approved') {
    return { Icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Approved' };
  }
  if (status === 'rejected') {
    return { Icon: XCircle, text: 'text-rose-700', bg: 'bg-rose-50', label: 'Rejected' };
  }
  return { Icon: Clock, text: 'text-amber-700', bg: 'bg-amber-50', label: 'Pending' };
}

export default function ConsentStatusPage() {
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConsentStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setConsentRequests(await orgAPI.getConsentStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consent status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConsentStatus();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return consentRequests
      .filter((request) => activeFilter === 'all' || request.status === activeFilter)
      .filter((request) => {
        if (!normalizedSearch) return true;

        return [
          `REQ-${request.id}`,
          request.type,
          request.status,
          request.patient_id,
          request.record_id,
          request.reason,
          request.requester_name,
          request.organization_type,
          formatDate(request.timestamp),
        ]
          .filter((value) => value !== null && value !== undefined)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [activeFilter, consentRequests, searchTerm]);

  const stats = {
    total: consentRequests.length,
    approved: consentRequests.filter((request) => request.status === 'approved').length,
    pending: consentRequests.filter((request) => request.status === 'pending').length,
    rejected: consentRequests.filter((request) => request.status === 'rejected').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Consent Status</h1>
          <p className="mt-1 text-slate-500">Track patient approvals for uploads, modifications, and deletions.</p>
        </div>
        <button
          type="button"
          onClick={loadConsentStatus}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Requests', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-xl', stat.bg, stat.color)}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <h3 className={cn('mt-2 text-2xl font-bold', stat.color)}>{isLoading ? '--' : stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b p-6 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-2 font-bold text-slate-900">Request Pipeline</h3>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'rounded-lg px-3 py-1 text-[10px] font-bold capitalize transition-all',
                  activeFilter === filter ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search requests..."
              className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-medical-500/20 md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {error && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-rose-600" colSpan={6}>
                    {error}
                  </td>
                </tr>
              )}

              {!error && isLoading && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={6}>
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-medical-600" />
                      Loading consent requests...
                    </div>
                  </td>
                </tr>
              )}

              {!error && !isLoading && filteredRequests.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={6}>
                    No consent requests found{searchTerm.trim() || activeFilter !== 'all' ? ' for the selected filters.' : '.'}
                  </td>
                </tr>
              )}

              {!isLoading && filteredRequests.map((request) => {
                const ActionIcon = actionIcon(request.type);
                const { Icon: StatusIcon, text, bg, label } = statusConfig(request.status);

                return (
                  <tr key={request.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold uppercase text-slate-500 font-mono">REQ-{request.id}</p>
                      {request.record_id && <p className="mt-1 text-[10px] font-semibold text-slate-400">Record #{request.record_id}</p>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Patient #{request.patient_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <ActionIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold capitalize text-slate-600">{request.type} record</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', bg, text)}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] italic text-slate-400 font-mono">{formatDate(request.timestamp)}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase text-medical-600 transition-colors hover:bg-medical-50"
                      >
                        View <Eye className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">REQ-{selectedRequest.id}</h2>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">Consent request detail</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close request detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {[
                ['Patient', `Patient #${selectedRequest.patient_id}`],
                ['Record', selectedRequest.record_id ? `Record #${selectedRequest.record_id}` : 'Not attached'],
                ['Action', `${selectedRequest.type} record`],
                ['Status', selectedRequest.status],
                ['Requested by', selectedRequest.requester_name],
                ['Organization type', selectedRequest.organization_type],
                ['Timestamp', formatDate(selectedRequest.timestamp)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold capitalize text-slate-800">{value}</p>
                </div>
              ))}
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reason</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedRequest.reason}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
