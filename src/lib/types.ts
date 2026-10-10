export interface ClinicalFeatures {
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  pedigree: number;
  age: number;
}

export interface DataQualityReport {
  flags: string[];
  is_reliable: boolean;
  flag_count: number;
  has_implausible_glucose: boolean;
  has_implausible_bmi: boolean;
  has_implausible_bp: boolean;
  missing_measurements: string[];
}

export type PriorityTier = "High Priority" | "Moderate Priority" | "Standard Follow-Up";

export interface ScoredPatientRecord {
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  hospital_name: string;
  model_score: number; // 0.0 to 1.0 (real ML model output)
  secondary_lr_score: number;
  priority_tier: PriorityTier;
  clinical_features: ClinicalFeatures;
  key_highlights: string[];
  quality: DataQualityReport;
  rank: number;
  
  // Nurse Action Status
  nurse_review_status: "pending" | "completed";
  nurse_reviewed_at?: string;
  nurse_reviewed_by?: string;

  // Generated messages
  nurse_prompt: string;
  patient_email_subject: string;
  patient_email_body: string;

  // Email status
  email_validation_status: "valid" | "invalid_format" | "duplicate" | "missing";
  email_send_status: "pending_review" | "approved" | "queued" | "sending" | "delivered" | "failed" | "skipped";
  email_sent_at?: string;
  email_error_reason?: string;
  email_retry_count?: number;
  message_id?: string;
}

export interface ExcelValidationResult {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  hospital_name: string;
  hospital_name_consistent: boolean;
  detected_hospitals: string[];
  errors: string[];
  warnings: string[];
  duplicate_patient_ids: string[];
  duplicate_emails: string[];
  records: any[];
}

export interface EmailBatchJob {
  batch_id: string;
  hospital_name: string;
  total_recipients: number;
  approved_by: string;
  approved_at: string;
  is_test_mode: boolean;
  status: "idle" | "in_progress" | "completed" | "partially_failed";
  delivered_count: number;
  failed_count: number;
  skipped_count: number;
  started_at: string;
  completed_at?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "LOGIN" | "UPLOAD_WORKBOOK" | "RUN_SCORING" | "APPROVE_EMAIL_BATCH" | "DISPATCH_EMAILS" | "EXPORT_EXCEL" | "SETTINGS_UPDATE";
  details: string;
  metadata?: Record<string, any>;
  ip_address?: string;
}

export interface ModelMetrics {
  version: string;
  training_date: string;
  selected_model: {
    key: string;
    name: string;
    rationale: string;
  };
  models_evaluated: {
    [key: string]: {
      name: string;
      hyperparameters: Record<string, any>;
      test_metrics: {
        accuracy: number;
        roc_auc: number;
        pr_auc: number;
        precision: number;
        recall: number;
        specificity: number;
        f1: number;
        brier_score: number;
        confusion_matrix: {
          tn: number;
          fp: number;
          fn: number;
          tp: number;
        };
        roc_curve: {
          fpr: number[];
          tpr: number[];
        };
      };
      feature_explanations: Array<{
        feature: string;
        importance?: number;
        percentage?: number;
        coefficient?: number;
        odds_ratio?: number;
        direction?: string;
        clinical_relevance: string;
      }>;
    };
  };
  clinical_disclaimer: string;
}
