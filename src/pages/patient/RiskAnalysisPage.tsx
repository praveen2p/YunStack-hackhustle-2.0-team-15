import { useCallback, useEffect, useState } from 'react';
import type { Key } from 'react';
import { motion } from 'motion/react';
import {
  ActivitySquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { patientAPI } from '../../lib/api';
import { PatientRiskAnalysis, RiskActionPlan, RiskCard } from '../../types';

const RING_RADIUS = 76;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const levelStyles: Record<string, { text: string; bg: string; border: string; ring: string; iconBg: string; progress: string }> = {
  high: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'text-rose-500',
    iconBg: 'bg-rose-100',
    progress: 'bg-rose-500',
  },
  moderate: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'text-amber-500',
    iconBg: 'bg-amber-100',
    progress: 'bg-amber-500',
  },
  medium: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'text-amber-500',
    iconBg: 'bg-amber-100',
    progress: 'bg-amber-500',
  },
  low: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'text-emerald-500',
    iconBg: 'bg-emerald-100',
    progress: 'bg-emerald-500',
  },
  insufficient: {
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    ring: 'text-slate-400',
    iconBg: 'bg-slate-100',
    progress: 'bg-slate-400',
  },
};

function planIcon(icon: RiskActionPlan['icon']) {
  if (icon === 'stethoscope') return Stethoscope;
  if (icon === 'pill') return Pill;
  return ActivitySquare;
}

function getLevelStyles(level?: string) {
  return levelStyles[level?.toLowerCase() || ''] ?? levelStyles.low;
}

function clampScore(score?: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function trendContent(trend: string) {
  if (trend === 'rising') {
    return {
      Icon: TrendingUp,
      label: 'Increasing',
      className: 'text-rose-600',
    };
  }

  if (trend === 'falling') {
    return {
      Icon: TrendingDown,
      label: 'Improving',
      className: 'text-emerald-600',
    };
  }

  return {
    Icon: CheckCircle2,
    label: 'Stable',
    className: 'text-emerald-600',
  };
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="h-5 w-2/3 rounded bg-slate-100" />
      <div className="mx-auto mt-8 h-40 w-40 rounded-full bg-slate-100" />
      <div className="mt-8 space-y-3">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
        <div className="h-12 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function RiskScoreRing({ score, level }: { score: number; level: string }) {
  const styles = getLevelStyles(level);
  const dashOffset = RING_CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="relative mx-auto h-40 w-40 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 176 176" role="img" aria-label={`${score} risk index`}>
        <circle
          cx="88"
          cy="88"
          r={RING_RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="12"
          className="text-slate-100"
        />
        <motion.circle
          cx="88"
          cy="88"
          r={RING_RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className={styles.ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums text-slate-900">{score}</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Index</span>
      </div>
    </div>
  );
}

function RiskPanel({ risk, index }: { key?: Key; risk: RiskCard; index: number }) {
  const score = clampScore(risk.score);
  const styles = getLevelStyles(risk.level);
  const { Icon, label, className } = trendContent(risk.trend);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex min-h-full flex-col rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold leading-snug text-slate-900">{risk.name}</h3>
        <span className={cn('shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold', styles.bg, styles.text, styles.border)}>
          {risk.level || 'Low'}
        </span>
      </div>

      <div className="mt-7">
        <RiskScoreRing score={score} level={risk.level} />
      </div>

      <p className="mt-7 text-center text-sm leading-relaxed text-slate-600">{risk.desc || 'No narrative explanation was generated for this risk signal.'}</p>

      <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidence</p>
        <div className="mt-3 space-y-2">
          {(risk.evidence?.length ? risk.evidence : ['No supporting features extracted yet.']).map((item, evidenceIndex) => (
            <p key={`${risk.id}-evidence-${evidenceIndex}`} className="text-xs font-semibold leading-relaxed text-slate-600">
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Current Trend</span>
        <div className={cn('flex items-center gap-1.5 text-xs font-bold', className)}>
          <Icon className="h-4 w-4" />
          {label}
        </div>
      </div>
    </motion.article>
  );
}

export default function RiskAnalysisPage() {
  const [analysis, setAnalysis] = useState<PatientRiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRiskAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setAnalysis(await patientAPI.getRiskAnalysis());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk analysis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRiskAnalysis();
  }, [loadRiskAnalysis]);

  const risks = analysis?.risks ?? [];
  const explainability = analysis?.explainability ?? [];
  const actionPlan = analysis?.action_plan ?? [];
  const overallScore = clampScore(analysis?.overall?.score);
  const overallStyles = getLevelStyles(analysis?.overall?.level);
  const modelMetadata = analysis?.model_metadata;
  const engineLabel = modelMetadata?.llm_risk_scores_used
    ? 'Gemini Risk Synthesis'
    : modelMetadata?.xgboost_dataset
      ? 'FHIR XGBoost'
      : modelMetadata?.risk_engine;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            {analysis?.headline || 'Predictive Risk Analysis'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            {analysis?.subheadline || 'Risk signals based on longitudinal patient records.'}
          </p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            <strong>For informational purposes only.</strong>{' '}
            {analysis?.disclaimer || 'This analysis is generated by an AI model and is not a medical diagnosis. Always consult a qualified healthcare professional before making any health decisions.'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {analysis?.analysis_node || 'HP-XG-77'}
          </div>
          {engineLabel && (
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Zap className="h-3.5 w-3.5 text-medical-600" />
              {engineLabel}
            </div>
          )}
          <button
            type="button"
            onClick={loadRiskAnalysis}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Risk analysis could not be loaded.</p>
              <p className="mt-1 text-rose-700">{error}</p>
            </div>
          </div>
          <button type="button" onClick={loadRiskAnalysis} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-rose-700 shadow-sm">
            Try again
          </button>
        </div>
      )}

      <section>
        <div className={cn('rounded-lg border p-6 shadow-sm', overallStyles.bg, overallStyles.border)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cn('text-xs font-black uppercase tracking-widest', overallStyles.text)}>Overall Risk</p>
              <h2 className="mt-2 text-4xl font-black tabular-nums text-slate-900">{isLoading ? '--' : overallScore}</h2>
            </div>
            <div className={cn('rounded-lg p-3', overallStyles.iconBg, overallStyles.text)}>
              <ActivitySquare className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {analysis?.overall
              ? `${analysis.overall.level} model classification with ${analysis.overall.confidence} confidence.`
              : 'Waiting for the model to return an overall score.'}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/70">
            <div className={cn('h-full rounded-full', overallStyles.progress)} style={{ width: `${isLoading ? 0 : overallScore}%` }} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {isLoading && [0, 1, 2].map((item) => <SkeletonCard key={item} />)}

        {!isLoading && risks.length === 0 && !error && (
          <div className="rounded-lg border bg-white p-8 text-sm font-bold text-slate-500 shadow-sm lg:col-span-3">
            No risk analysis is available yet. Upload or refresh clinical records to generate this view.
          </div>
        )}

        {!isLoading && risks.map((risk, index) => <RiskPanel key={risk.id || risk.name} risk={risk} index={index} />)}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-slate-950 p-6 text-white shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-medical-500/30 bg-medical-500/15 text-medical-300">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight font-display">Explainable AI Insights</h3>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Generating explanation blocks...
              </div>
            )}
            {!isLoading && explainability.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                No explanation blocks generated yet.
              </div>
            )}
            {!isLoading && explainability.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    item.tone === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400',
                  )}>
                    {item.tone === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold leading-snug">{item.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-medical-300">
                      Clinical evidence explanation <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 font-display">Generated Health Path</h3>
          <div className="space-y-5">
            {isLoading && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Building action plan...
              </div>
            )}
            {!isLoading && actionPlan.length === 0 && (
              <div className="text-sm font-semibold text-slate-500">No action plan generated yet.</div>
            )}
            {!isLoading && actionPlan.map((plan, index) => {
              const Icon = planIcon(plan.icon);
              return (
                <div key={`${plan.title}-${index}`} className="relative flex gap-4">
                  {index < actionPlan.length - 1 && <div className="absolute bottom-0 left-5 top-11 w-px bg-slate-100" />}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-slate-50 text-slate-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pb-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h4 className="font-bold leading-snug text-slate-900">{plan.title}</h4>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-medical-600">{plan.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{plan.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
