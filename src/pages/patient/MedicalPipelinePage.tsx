import { motion } from 'motion/react';
import { 
  Cpu, 
  Search, 
  Brain, 
  Layers, 
  Database, 
  LineChart, 
  Lightbulb, 
  ChevronRight,
  ShieldCheck,
  FileSearch,
  Code,
  Box
} from 'lucide-react';

const pipelineSteps = [
  { 
    id: 'opencv', 
    name: 'OpenCV Artifact Detection', 
    desc: 'Image preparation & edge detection for messy prescriptions.',
    tech: 'Computer Vision',
    icon: Search,
    color: 'bg-blue-500',
    status: 'Operational'
  },
  { 
    id: 'trocr', 
    name: 'TrOCR Text Recognition', 
    desc: 'Transformer-based OCR for ultra-accurate handwritten text.',
    tech: 'PyTorch / Transformers',
    icon: FileSearch,
    color: 'bg-indigo-500',
    status: 'Operational'
  },
  { 
    id: 'scispacy', 
    name: 'SciSpacy Entity Linker', 
    desc: 'Identifying medical entities (Drug, Dose, Route, Frequency).',
    tech: 'spaCy / SciSpacy',
    icon: Code,
    color: 'bg-purple-500',
    status: 'Active'
  },
  { 
    id: 'bert', 
    name: 'BioClinicalBERT Parser', 
    desc: 'Deep semantic understanding of clinical context and relations.',
    tech: 'Clinical-BERT Hub',
    icon: Brain,
    color: 'bg-fuchsia-500',
    status: 'Active'
  },
  { 
    id: 'json', 
    name: 'Structured FHIR JSON', 
    desc: 'Converting raw text into standardized medical exchange format.',
    tech: 'FHIR R4 Standard',
    icon: Box,
    color: 'bg-emerald-500',
    status: 'Healthy'
  },
  { 
    id: 'mongodb', 
    name: 'Vector Database Storage', 
    desc: 'Encrypted storage with AI vector indexing for fast retrieval.',
    tech: 'MongoDB Atlas / Vector',
    icon: Database,
    color: 'bg-medical-600',
    status: 'Secure'
  },
  { 
    id: 'flan', 
    name: 'FLAN-T5 Synthesis', 
    desc: 'Summarizing 10+ years of history into clinical abstractions.',
    tech: 'Seq2Seq Reasoning',
    icon: Lightbulb,
    color: 'bg-amber-500',
    status: 'Reasoning'
  },
  { 
    id: 'xgboost', 
    name: 'XGBoost Risk Engine', 
    desc: 'Predictive modeling for CVD, CKD, and Diabetes progression.',
    tech: 'Gradient Boosting',
    icon: LineChart,
    color: 'bg-rose-500',
    status: 'Inferring'
  },
  { 
    id: 'gemini', 
    name: 'Gemini AI Insights', 
    desc: 'Conversational medical reasoning and doctor-first insights.',
    tech: 'Gemini 1.5 Flash',
    icon: Cpu,
    color: 'bg-slate-900',
    status: 'Ready'
  }
];

export default function MedicalPipelinePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-medical-100 bg-medical-50 px-4 py-1.5 text-sm font-medium text-medical-700 mb-6">
          <Layers className="h-4 w-4" />
          <span>System Architecture</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight sm:text-5xl">The Intelligence Pipeline</h1>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto text-lg hover:text-slate-700 transition-colors">
          Explore how HealPath AI transforms fragmented medical chaos into a longitudinal structured memory.
        </p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-emerald-500 to-slate-900 hidden lg:block -translate-x-1/2 opacity-20"></div>

        <div className="space-y-12 relative z-10">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 0;

            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`flex flex-col lg:flex-row items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
              >
                {/* Content */}
                <div className={`flex-1 text-center ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`inline-flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest ${isEven ? 'flex-row-reverse' : ''}`}>
                    <span className="text-slate-400">{step.tech}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.name}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-md mx-auto lg:mx-0 inline-block">{step.desc}</p>
                </div>

                {/* Visual Node */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className={`h-20 w-20 rounded-3xl ${step.color} text-white flex items-center justify-center shadow-2xl relative z-20 group transition-transform hover:scale-110`}>
                    <Icon className="h-10 w-10" />
                    {/* Pulsing glow */}
                    <div className={`absolute inset-0 rounded-3xl ${step.color} blur-xl opacity-40 group-hover:opacity-80 transition-opacity -z-10`}></div>
                  </div>
                  
                  {/* Status Tag */}
                  <div className="absolute top-24 whitespace-nowrap bg-white border shadow-sm px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{step.status}</span>
                  </div>
                </div>

                {/* Spacer for reverse flex */}
                <div className="flex-1 hidden lg:block"></div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="h-48 w-48" />
        </div>
        <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Zero-Trust Processing Guard</h3>
            <p className="text-slate-400 leading-relaxed">
              Every stage of the pipeline produces a cryptographic hash. The next stage only executes if the 
              previous hash matches the master ledger, ensuring that your data remains untampered throughout the 
              AI transformation lifecycle.
            </p>
          </div>
          <div className="flex justify-end gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
              <p className="text-2xl font-bold text-medical-400 font-mono">0.02s</p>
              <p className="text-[10px] uppercase text-slate-500 font-bold mt-1">Verification Latency</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
              <p className="text-2xl font-bold text-emerald-400 font-mono">99.9%</p>
              <p className="text-[10px] uppercase text-slate-500 font-bold mt-1">Extraction Confidence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
