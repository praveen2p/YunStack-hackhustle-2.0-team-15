import { motion } from 'motion/react';
import { 
  Shield, 
  Brain, 
  Clock, 
  Lock, 
  ArrowRight, 
  Activity, 
  FileText, 
  UserCheck, 
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-600 text-white shadow-lg ">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">Memora AI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-medical-600">Features</a>
            <a href="#security" className="text-sm font-medium text-slate-600 hover:text-medical-600">Security</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-medical-600">Our Mission</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login-role')}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/login-role')}
              className="rounded-full bg-medical-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-medical-200 hover:bg-medical-700 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-medical-50 blur-3xl opacity-60 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-50 blur-3xl opacity-40 -translate-x-1/2 translate-y-1/4"></div>
        
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={fadeIn}
            className="inline-flex items-center gap-2 rounded-full border border-medical-100 bg-medical-50 px-4 py-1.5 text-sm font-medium text-medical-700"
          >
            <Activity className="h-4 w-4" />
            <span>Next-Gen Healthcare Management</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl lg:text-8xl"
          >
            Your Medical History,<br />
            <span className="text-medical-600">Unlocked & Secured.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-slate-600 sm:text-xl lg:text-2xl leading-relaxed"
          >
            Memora AI is a premium longitudinal healthcare memory platform. 
            We unify your fragmented medical records into a single, AI-powered secure timeline 
            controlled entirely by your consent.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button 
              onClick={() => navigate('/login-role')}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:bg-slate-800 sm:w-auto"
            >
              Start for Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-slate-900 sm:text-4xl">Intelligence meets Integrity</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Our platform combines advanced AI extraction with a strict zero-trust consent model to redefine medical record keeping.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: 'Longitudinal Memory', 
                desc: 'A complete, chronological record of your health journey from birth to present.',
                icon: Clock,
                color: 'text-medical-600'
              },
              { 
                title: 'AI Medical Insights', 
                desc: 'Gemini-powered analysis detects risks and explains medical jargon in plain language.',
                icon: Brain,
                color: 'text-purple-600'
              },
              { 
                title: 'Consent-First Protocol', 
                desc: 'Every upload, modification, or deletion requires your explicit digital signature.',
                icon: Shield,
                color: 'text-green-600'
              },
              { 
                title: 'Smart Extraction', 
                desc: 'Transform paper prescriptions and messy lab reports into structured medical data.',
                icon: FileText,
                color: 'text-blue-600'
              },
              { 
                title: 'Interoperable Hub', 
                desc: 'Integrated with doctors, labs, and pharmacies for seamless data exchange.',
                icon: Stethoscope,
                color: 'text-orange-600'
              },
              { 
                title: 'Verified Identity', 
                desc: 'Face authentication ensures that only you can access your most sensitive data.',
                icon: UserCheck,
                color: 'text-red-600'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-xl"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-white transition-colors`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{feature.desc}</p>
                <button className="mt-6 flex items-center gap-1 text-sm font-bold text-medical-600 hover:gap-2 transition-all">
                  Learn More <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-full w-full bg-slate-900 overflow-hidden">
          <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-medical-500/10 blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 text-white">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-medical-400">
                <Lock className="h-4 w-4" />
                <span>Military-Grade Security</span>
              </div>
              <h2 className="mt-8 font-display text-4xl font-bold sm:text-5xl">Your data belongs to you.<br />Period.</h2>
              <p className="mt-6 text-slate-400 text-lg leading-relaxed">
                We believe healthcare should be secure by design. Every action on Memora AI 
                is written to a tamper-evident audit ledger and protected with patient-controlled consent.
              </p>
              
              <ul className="mt-10 space-y-4">
                {[
                  'AES-256-GCM encrypted records and documents',
                  'Hash-chained tamper-evident audit ledger',
                  'WebAuthn platform biometric verification',
                  'HIPAA & GDPR-ready technical safeguards'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-medical-500 text-white">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="glass rounded-3xl p-8 border-white/5 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">Secure Access Node</h3>
                    <p className="text-sm text-slate-400">System Monitoring: Online</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-white/5 w-full overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                        className="h-full w-1/3 bg-medical-500/40 blur-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 rounded-xl bg-medical-500 text-center font-bold text-lg">
                  Access Granted
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] rounded-full border border-white/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-medical-600 text-white shadow-lg ">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">Memora AI</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-medical-600">Privacy Policy</a>
              <a href="#" className="hover:text-medical-600">Terms of Service</a>
              <a href="#" className="hover:text-medical-600">Legal</a>
            </div>
            <p className="text-sm text-slate-400">© 2026 Memora AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
