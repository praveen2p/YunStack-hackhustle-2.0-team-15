import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Download,
  Eye,
  History,
  Loader2,
  RefreshCw,
  Search,
  Terminal,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { orgAPI } from '../../lib/api';
import { AuditLog } from '../../types';

const filters = ['all', 'success', 'warning', 'error'] as const;
type StatusFilter = (typeof filters)[number];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusConfig(status: AuditLog['status']) {
  if (status === 'success') {
    return { Icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Success' };
  }
  if (status === 'error') {
    return { Icon: XCircle, text: 'text-rose-700', bg: 'bg-rose-50', label: 'Error' };
  }
  return { Icon: Activity, text: 'text-amber-700', bg: 'bg-amber-50', label: 'Warning' };
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setLogs(await orgAPI.getAuditLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return logs
      .filter((log) => activeFilter === 'all' || log.status === activeFilter)
      .filter((log) => {
        if (!normalizedSearch) return true;

        return [
          log.id,
          log.action,
          log.user_name,
          log.resource_id,
          log.details,
          log.status,
          formatDate(log.timestamp),
        ]
          .filter((value) => value !== null && value !== undefined)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [activeFilter, logs, searchTerm]);

  const stats = {
    total: logs.length,
    success: logs.filter((log) => log.status === 'success').length,
    warning: logs.filter((log) => log.status === 'warning').length,
    error: logs.filter((log) => log.status === 'error').length,
  };

  const exportFilteredLogs = () => {
    const header = ['id', 'timestamp', 'user', 'action', 'resource_id', 'details', 'status'];
    const rows = filteredLogs.map((log) => [
      log.id,
      formatDate(log.timestamp),
      log.user_name,
      log.action,
      log.resource_id || '',
      log.details,
      log.status,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'organization-access-logs.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Organization Access Logs</h1>
          <p className="mt-1 text-slate-500">Review your organization's interactions with patient data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={exportFilteredLogs}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Success', value: stats.success, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Warnings', value: stats.warning, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Errors', value: stats.error, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-xl', stat.bg, stat.color)}>
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <h3 className={cn('mt-2 text-2xl font-bold', stat.color)}>{isLoading ? '--' : stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b p-6 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-3 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Historical Chain</h3>
            </div>
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search action, target, details..."
              className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-medical-500/20 md:w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Protocol Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Execution Details</th>
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
                      Loading access logs...
                    </div>
                  </td>
                </tr>
              )}

              {!error && !isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500" colSpan={6}>
                    No access logs found{searchTerm.trim() || activeFilter !== 'all' ? ' for the selected filters.' : '.'}
                  </td>
                </tr>
              )}

              {!isLoading && filteredLogs.map((log) => {
                const { Icon: StatusIcon, text, bg, label } = statusConfig(log.status);

                return (
                  <tr key={log.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-400">
                          <History className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-bold capitalize text-slate-900">{log.action.replaceAll('_', ' ').toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {log.resource_id ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <User className="h-3 w-3" /> {log.resource_id}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">No target</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs truncate text-xs font-medium text-slate-500">{log.details}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', bg, text)}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-[10px] text-slate-400">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
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

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Log #{selectedLog.id}</h2>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">Access event detail</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close log detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {[
                ['Action', selectedLog.action.replaceAll('_', ' ')],
                ['User', selectedLog.user_name],
                ['Target', selectedLog.resource_id || 'No target'],
                ['Status', selectedLog.status],
                ['Timestamp', formatDate(selectedLog.timestamp)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold capitalize text-slate-800">{value}</p>
                </div>
              ))}
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Execution details</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedLog.details}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
