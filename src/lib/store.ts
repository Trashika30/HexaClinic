import { ScoredPatientRecord, AuditLogEntry, ModelMetrics } from "./types";
import fs from "fs";
import path from "path";

interface ApplicationState {
  currentHospital: string;
  scoredRecords: ScoredPatientRecord[];
  top100Records: ScoredPatientRecord[];
  auditLogs: AuditLogEntry[];
  lastUploadTimestamp?: string;
  lastScoredTimestamp?: string;
  emailApprovalStatus: boolean;
  emailApprovedBy?: string;
  emailApprovedAt?: string;
  isTestMode: boolean;
}

// Global in-memory cache for the server runtime
declare global {
  var __medisense_state: ApplicationState | undefined;
}

function getInitialState(): ApplicationState {
  return {
    currentHospital: "HexaClinic for Diabetes",
    scoredRecords: [],
    top100Records: [],
    auditLogs: [
      {
        id: "audit_init_1",
        timestamp: new Date().toISOString(),
        actor: "System",
        action: "SETTINGS_UPDATE",
        details: "HexaClinic for Diabetes clinical decision support platform initialized with Pima benchmark ML model v1.0.0",
      },
    ],
    emailApprovalStatus: false,
    isTestMode: true,
  };
}

export function getState(): ApplicationState {
  if (!global.__medisense_state) {
    global.__medisense_state = getInitialState();
  }
  return global.__medisense_state;
}

export function updateState(partial: Partial<ApplicationState>): ApplicationState {
  const current = getState();
  global.__medisense_state = {
    ...current,
    ...partial,
  };
  return global.__medisense_state;
}

export function addAuditLog(actor: string, action: AuditLogEntry["action"], details: string, metadata?: Record<string, any>) {
  const state = getState();
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    metadata,
  };
  state.auditLogs.unshift(entry);
  return entry;
}

export function loadModelReport(): ModelMetrics | null {
  try {
    const reportPath = path.join(process.cwd(), "ml", "saved_models", "evaluation_report.json");
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading model report:", err);
  }
  return null;
}
