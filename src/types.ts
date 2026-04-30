/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'patient' | 'doctor' | 'lab' | 'pharmacist' | 'clinic' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  hp_id?: string;
  organization?: string;
  avatar?: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  provider_id: number;
  provider_name: string;
  type: 'lab' | 'prescription' | 'imaging' | 'consultation' | 'vaccination' | 'discharge';
  title: string;
  date: string;
  content: string;
  file_name?: string;
  file_content_type?: string;
  file_size?: number;
  storage_provider?: string;
  storage_key?: string;
  status: 'active' | 'pending' | 'archived';
}

export interface ConsentRequest {
  id: number;
  type: 'upload' | 'modify' | 'delete';
  requester_id: number;
  requester_name: string;
  organization_type: string;
  patient_id: number;
  record_id?: number;
  timestamp: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number;
  user_name: string;
  action: string;
  resource_id?: string;
  details: string;
  previous_hash?: string;
  entry_hash?: string;
  status: 'success' | 'warning' | 'error';
}

export interface SummaryMetric {
  label: string;
  value: string;
  status: string;
}

export interface SummaryMedication {
  name: string;
  dose: string;
  purpose: string;
}

export interface PatientAISummary {
  headline: string;
  paragraphs: string[];
  stable_metrics: SummaryMetric[];
  medications: SummaryMedication[];
  model_metadata: {
    llm: string;
    risk_engine: string;
    document_pipeline: string[];
    records_analyzed: number;
    generated_at: string;
  };
}

export interface RiskCard {
  id: string;
  name: string;
  score: number;
  level: string;
  color: string;
  text: string;
  bg: string;
  desc: string;
  trend: string;
  evidence: string[];
}

export interface RiskInsight {
  title: string;
  description: string;
  tone: 'warning' | 'positive';
}

export interface RiskActionPlan {
  title: string;
  desc: string;
  status: string;
  icon: 'activity' | 'stethoscope' | 'pill';
}

export interface PatientRiskAnalysis {
  headline: string;
  subheadline: string;
  analysis_node: string;
  disclaimer: string;
  overall: {
    score: number;
    level: string;
    confidence: string;
  };
  risks: RiskCard[];
  explainability: RiskInsight[];
  action_plan: RiskActionPlan[];
  model_metadata: {
    llm: string;
    risk_engine: string;
    records_analyzed: number;
    snapshot_record_id?: number;
    snapshot_feature_count?: number;
    xgboost_probabilities?: Record<string, number> | null;
    xgboost_dataset?: {
      engine: string;
      dataset_dir: string;
      rows_trained: number;
      label_distribution: Record<string, number>;
    } | null;
    xgboost_status?: {
      engine: string;
      dataset_dir: string;
      xgboost_available: boolean;
      model_loaded: boolean;
      unavailable_reason?: string | null;
      dataset_files?: Record<string, { exists: boolean; size: number }>;
    };
    llm_risk_scores_used?: boolean;
    features_used: string[];
    generated_at: string;
  };
}
