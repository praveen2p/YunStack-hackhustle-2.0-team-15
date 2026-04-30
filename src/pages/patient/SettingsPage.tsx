import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Fingerprint,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { patientAPI } from '../../lib/api';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function PatientSettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1 (555) 012-3210');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    consentRequests: true,
    recordUploads: true,
    securityAlerts: true,
  });
  const [privacy, setPrivacy] = useState({
    biometricUnlock: true,
    emergencyAccess: false,
    auditDigest: true,
  });

  const initials = (user?.name || user?.email || 'Patient')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const saveProfile = async () => {
    setSaveState('saving');
    setMessage(null);

    try {
      const updated = await patientAPI.updateProfile({ name, email });
      updateUser(updated);
      setSaveState('saved');
      setMessage('Profile updated successfully.');
    } catch (err) {
      setSaveState('error');
      setMessage(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">Patient Settings</h1>
          <p className="mt-1 text-slate-500">Manage your profile, security preferences, and consent notifications.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protected Account
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-medical-50 text-3xl font-black text-medical-700 shadow-lg shadow-medical-100">
              {initials || <User className="h-10 w-10" />}
            </div>
            <h2 className="font-bold text-slate-900">{user?.name || 'Patient'}</h2>
            <p className="mt-1 text-xs font-mono text-slate-500">HID: {user?.hp_id || 'Pending'}</p>
            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Email</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-700">{user?.email}</p>
            </div>
          </section>

          <section className="rounded-2xl border bg-slate-950 p-6 text-white shadow-xl shadow-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Security Vault</h2>
                <p className="mt-1 text-xs text-slate-400">Identity protection status</p>
              </div>
              <Lock className="h-5 w-5 text-medical-300" />
            </div>
            <div className="space-y-4">
              {[
                { label: 'Biometric Auth', value: privacy.biometricUnlock ? 'Enabled' : 'Off' },
                { label: 'Consent Ledger', value: 'Active' },
                { label: 'Audit Trail', value: privacy.auditDigest ? 'On' : 'Off' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-300">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50/70 p-6">
              <h2 className="font-bold text-slate-900">Profile Details</h2>
              <p className="mt-1 text-sm text-slate-500">Keep your patient identity details current.</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-colors focus:border-medical-500 focus:bg-white"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</span>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-colors focus:border-medical-500 focus:bg-white"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-colors focus:border-medical-500 focus:bg-white"
                  />
                </div>
              </label>

              {message && (
                <div className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold',
                  saveState === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                )}>
                  {saveState === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={saveProfile}
                disabled={saveState === 'saving'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saveState === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Profile
              </button>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Notifications</h2>
                  <p className="text-xs text-slate-500">Choose what needs your attention.</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'consentRequests' as const, label: 'Consent requests', desc: 'Approval requests from doctors and clinics' },
                  { key: 'recordUploads' as const, label: 'Record uploads', desc: 'New documents added to your vault' },
                  { key: 'securityAlerts' as const, label: 'Security alerts', desc: 'Sign-ins, downloads, and audit events' },
                ].map((item) => (
                  <SettingToggle
                    key={item.key}
                    label={item.label}
                    desc={item.desc}
                    checked={notifications[item.key]}
                    onChange={() => toggleNotification(item.key)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Privacy Controls</h2>
                  <p className="text-xs text-slate-500">Tune account access safeguards.</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'biometricUnlock' as const, label: 'Biometric unlock', desc: 'Allow face authentication for faster sign-in' },
                  { key: 'emergencyAccess' as const, label: 'Emergency access', desc: 'Allow emergency providers to request access' },
                  { key: 'auditDigest' as const, label: 'Audit digest', desc: 'Receive a summary of record access activity' },
                ].map((item) => (
                  <SettingToggle
                    key={item.key}
                    label={item.label}
                    desc={item.desc}
                    checked={privacy[item.key]}
                    onChange={() => togglePrivacy(item.key)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">Linked Devices</h2>
                <p className="mt-1 text-sm text-slate-500">Devices with recent access to your patient account.</p>
              </div>
              <KeyRound className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {[
                { name: 'Primary Mobile Device', time: 'Currently active', icon: Smartphone, status: 'Trusted' },
                { name: 'Desktop Browser', time: 'Last sync: 2h ago', icon: Globe, status: 'Verified' },
              ].map((device) => (
                <div key={device.name} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      <device.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{device.name}</p>
                      <p className="text-xs text-slate-500">{device.time}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                  <h2 className="font-bold">Data Erasure Request</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-rose-700">
                  Request deletion of your identity vault and record links. The request is reviewed before permanent removal.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-100 transition-colors hover:bg-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Request Erasure
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  desc,
  checked,
  onChange,
}: {
  key?: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-white"
    >
      <span>
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
      </span>
      <span className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-medical-600' : 'bg-slate-300'
      )}>
        <span className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )} />
      </span>
    </button>
  );
}
