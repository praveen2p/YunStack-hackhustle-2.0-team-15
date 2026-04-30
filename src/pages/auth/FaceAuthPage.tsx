import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Fingerprint, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type BioStatus = 'checking' | 'ready' | 'enrolling' | 'verifying' | 'success' | 'unsupported' | 'error';

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const binary = Array.from(view, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export default function FaceAuthPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<BioStatus>('checking');
  const [message, setMessage] = useState('Checking this device for biometric verification support.');

  const credentialKey = useMemo(() => `healpath_webauthn_${user?.id ?? 'anonymous'}`, [user?.id]);
  const savedCredentialId = typeof window !== 'undefined' ? localStorage.getItem(credentialKey) : null;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login-role', { replace: true });
      return;
    }

    if (!navigator.credentials || !window.PublicKeyCredential) {
      setStatus('unsupported');
      setMessage('This browser does not expose WebAuthn biometric verification.');
      return;
    }

    void window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        if (!available) {
          setStatus('unsupported');
          setMessage('This browser or device does not expose a platform biometric authenticator.');
          return;
        }
        setStatus('ready');
        setMessage(savedCredentialId ? 'Use your enrolled device biometric to continue.' : 'Enroll this device with your biometric authenticator.');
      })
      .catch(() => {
        setStatus('unsupported');
        setMessage('Biometric verification is not available in this browser session.');
      });
  }, [isAuthenticated, navigate, savedCredentialId, user]);

  const complete = () => {
    setStatus('success');
    setMessage('Identity verified with platform authenticator.');
    window.setTimeout(() => navigate('/patient', { replace: true }), 900);
  };

  const enroll = async () => {
    if (!user) return;
    setStatus('enrolling');
    setMessage('Waiting for your device biometric prompt.');

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'Memora AI' },
          user: {
            id: randomBytes(16),
            name: user.email,
            displayName: user.name,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential | null;

      if (!credential) throw new Error('No credential was created.');
      localStorage.setItem(credentialKey, bytesToBase64Url(credential.rawId));
      complete();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Biometric enrollment failed.');
    }
  };

  const verify = async () => {
    setStatus('verifying');
    setMessage('Waiting for biometric verification.');

    try {
      const allowCredentials = savedCredentialId
        ? [{ type: 'public-key' as const, id: base64UrlToBytes(savedCredentialId) }]
        : undefined;

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials,
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) throw new Error('No biometric assertion was returned.');
      complete();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Biometric verification failed.');
    }
  };

  const isBusy = status === 'checking' || status === 'enrolling' || status === 'verifying';
  const primaryAction = savedCredentialId ? verify : enroll;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-medical-50 text-medical-700">
            {status === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <Fingerprint className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Biometric Verification</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Verify access for <span className="font-bold text-slate-700">{user?.name}</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-medical-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {status === 'unsupported' ? 'Device not supported' : status === 'error' ? 'Verification interrupted' : 'Platform authenticator'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{message}</p>
            </div>
          </div>
        </div>

        {status === 'unsupported' && (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Use a device and browser with WebAuthn platform biometrics enabled, or continue with password authentication.</p>
          </div>
        )}

        <div className="mt-8 grid gap-3">
          {status !== 'unsupported' && status !== 'success' && (
            <button
              type="button"
              onClick={primaryAction}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {savedCredentialId ? 'Verify Biometric' : 'Enroll This Device'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/patient', { replace: true })}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Continue to dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
