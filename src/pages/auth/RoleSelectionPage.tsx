import { motion } from 'motion/react';
import { 
  User, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Hospital, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roles = [
  { 
    id: 'patient', 
    title: 'Patient', 
    desc: 'Access your medical memory and manage consents.', 
    icon: User, 
    color: 'bg-medical-500',
    path: '/login?role=patient'
  },
  { 
    id: 'doctor', 
    title: 'Doctor', 
    desc: 'Analyze patient history with AI surgical precision.', 
    icon: Stethoscope, 
    color: 'bg-indigo-500',
    path: '/login?role=doctor'
  },
  { 
    id: 'lab', 
    title: 'Lab', 
    desc: 'Securely upload diagnostic reports and test results.', 
    icon: FlaskConical, 
    color: 'bg-rose-500',
    path: '/login?role=lab',
    disabled: true
  },
  { 
    id: 'pharmacist', 
    title: 'Pharmacist', 
    desc: 'Manage prescriptions and medication delivery records.', 
    icon: Pill, 
    color: 'bg-emerald-500',
    path: '/login?role=pharmacist',
    disabled: true
  },
  { 
    id: 'clinic', 
    title: 'Clinic/Hospital', 
    desc: 'Enterprise governance for healthcare organizations.', 
    icon: Hospital, 
    color: 'bg-sky-500',
    path: '/login?role=clinic',
    disabled: true
  },
  { 
    id: 'admin', 
    title: 'System Admin', 
    desc: 'Platform audit, security monitoring & governance.', 
    icon: ShieldAlert, 
    color: 'bg-slate-800',
    path: '/login?role=admin',
    disabled: true
  }
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="mx-auto max-w-4xl w-full">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-600 text-white shadow-xl shadow-medical-100 mb-6"
          >
            <Stethoscope className="h-8 w-8" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Identity Gateway</h1>
          <p className="mt-4 text-slate-600 text-lg">Select your portal to enter the HealPath AI ecosystem.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, idx) => (
            <motion.button
              key={role.id}
              type="button"
              disabled={role.disabled}
              aria-disabled={role.disabled}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                if (!role.disabled) navigate(role.path);
              }}
              whileHover={role.disabled ? undefined : { scale: 1.02, y: -4 }}
              whileTap={role.disabled ? undefined : { scale: 0.98 }}
              className={`group relative h-full flex flex-col text-left rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                role.disabled
                  ? 'cursor-not-allowed opacity-50 grayscale'
                  : 'hover:shadow-xl hover:border-medical-200'
              }`}
            >
              {role.disabled && (
                <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Disabled
                </span>
              )}
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${role.color} text-white shadow-lg`}>
                <role.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{role.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{role.desc}</p>
              
              <div className={`mt-auto pt-4 flex items-center gap-2 text-sm font-bold transition-colors ${
                role.disabled ? 'text-slate-400' : 'text-slate-900 group-hover:text-medical-600'
              }`}>
                {role.disabled ? 'Login disabled' : `Continue as ${role.title}`}
                {!role.disabled && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-10 transition-opacity">
                <role.icon className="h-12 w-12 text-slate-900" />
              </div>
            </motion.button>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          Secure biometric-encrypted session initialized. 
          <span className="ml-2 font-mono text-[10px] uppercase">Node: HP-AX-992</span>
        </p>
      </div>
    </div>
  );
}
