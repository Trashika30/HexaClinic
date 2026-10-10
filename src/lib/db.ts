import fs from "fs";
import path from "path";
import { ScoredPatientRecord, AuditLogEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "medisense_database.json");

export interface DatabaseSchema {
  hospitalName: string;
  patientRecords: ScoredPatientRecord[];
  auditLogs: AuditLogEntry[];
  lastUploadTimestamp?: string;
  lastScoredTimestamp?: string;
  emailApprovalStatus: boolean;
  emailApprovedBy?: string;
  emailApprovedAt?: string;
  isTestMode: boolean;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDb(): DatabaseSchema {
  return {
    hospitalName: "HexaClinic for Diabetes",
    patientRecords: [],
    auditLogs: [
      {
        id: "audit_init_1",
        timestamp: new Date().toISOString(),
        actor: "System",
        action: "SETTINGS_UPDATE",
        details: "Persistent database initialized for HexaClinic for Diabetes",
      },
    ],
    emailApprovalStatus: false,
    isTestMode: true,
  };
}

export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const init = getInitialDb();
    writeDb(init);
    return init;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, resetting to clean initial DB:", err);
    const init = getInitialDb();
    writeDb(init);
    return init;
  }
}

export function writeDb(data: DatabaseSchema) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Saves new patient records into DB, replacing existing ones with same patient_id or adding new ones.
 * Keeps nurse_review_status if already completed. Re-ranks all records deterministically.
 */
export function savePatientRecords(newRecords: ScoredPatientRecord[], hospitalName: string = "HexaClinic for Diabetes") {
  const db = readDb();
  db.hospitalName = hospitalName;

  // Build map of existing records to preserve completion state
  const existingMap = new Map<string, ScoredPatientRecord>();
  db.patientRecords.forEach((r) => existingMap.set(r.patient_id, r));

  const mergedRecords: ScoredPatientRecord[] = newRecords.map((r) => {
    const existing = existingMap.get(r.patient_id);
    if (existing && existing.nurse_review_status === "completed") {
      return {
        ...r,
        nurse_review_status: "completed",
        nurse_reviewed_at: existing.nurse_reviewed_at,
        nurse_reviewed_by: existing.nurse_reviewed_by,
      };
    }
    return {
      ...r,
      nurse_review_status: r.nurse_review_status || "pending",
    };
  });

  // Re-rank records deterministically (Score DESC -> Age DESC -> PatientID ASC)
  mergedRecords.sort((a, b) => {
    if (b.model_score !== a.model_score) return b.model_score - a.model_score;
    if (b.clinical_features.age !== a.clinical_features.age) return b.clinical_features.age - a.clinical_features.age;
    return a.patient_id.localeCompare(b.patient_id);
  });

  mergedRecords.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  db.patientRecords = mergedRecords;
  db.lastScoredTimestamp = new Date().toISOString();
  db.emailApprovalStatus = false;

  db.auditLogs.unshift({
    id: `audit_save_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    action: "RUN_SCORING",
    details: `Updated persistent database with ${mergedRecords.length} patient records for ${hospitalName}.`,
  });

  writeDb(db);
  return db;
}

/**
 * Adds a single patient record directly into the DB without Excel upload.
 */
export function addSinglePatientToDb(record: ScoredPatientRecord): { db: DatabaseSchema; top100: ScoredPatientRecord[] } {
  const db = readDb();

  // Remove duplicate if already exists
  db.patientRecords = db.patientRecords.filter((r) => r.patient_id !== record.patient_id);
  db.patientRecords.push(record);

  // Re-rank all pending & completed records deterministically
  db.patientRecords.sort((a, b) => {
    if (b.model_score !== a.model_score) return b.model_score - a.model_score;
    if (b.clinical_features.age !== a.clinical_features.age) return b.clinical_features.age - a.clinical_features.age;
    return a.patient_id.localeCompare(b.patient_id);
  });

  db.patientRecords.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  db.auditLogs.unshift({
    id: `audit_add_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "Medical Staff",
    action: "SETTINGS_UPDATE",
    details: `Added patient ${record.patient_id} (${record.patient_name}) directly into persistent database. Score: ${(record.model_score * 100).toFixed(1)}%`,
  });

  writeDb(db);

  const activePending = db.patientRecords.filter((r) => r.nurse_review_status !== "completed");
  const top100 = activePending.slice(0, 100);

  return { db, top100 };
}

/**
 * Updates a patient record by PatientID in the persistent database.
 * Re-scores features and re-ranks all records deterministically.
 */
export function updatePatientRecordInDb(patientId: string, updatedRecord: ScoredPatientRecord): { success: boolean; db: DatabaseSchema; top100: ScoredPatientRecord[] } {
  const db = readDb();
  let found = false;

  db.patientRecords = db.patientRecords.map((r) => {
    if (r.patient_id === patientId) {
      found = true;
      return {
        ...r,
        ...updatedRecord,
        patient_id: patientId, // keep original ID
      };
    }
    return r;
  });

  if (!found) {
    // If not found, add as new record
    db.patientRecords.push(updatedRecord);
  }

  // Re-rank all pending & completed records deterministically (Score DESC -> Age DESC -> PatientID ASC)
  db.patientRecords.sort((a, b) => {
    if (b.model_score !== a.model_score) return b.model_score - a.model_score;
    if (b.clinical_features.age !== a.clinical_features.age) return b.clinical_features.age - a.clinical_features.age;
    return a.patient_id.localeCompare(b.patient_id);
  });

  db.patientRecords.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  db.auditLogs.unshift({
    id: `audit_update_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "Medical Staff",
    action: "SETTINGS_UPDATE",
    details: `Updated patient record ${patientId} (${updatedRecord.patient_name}). Glucose: ${updatedRecord.clinical_features.glucose} mg/dL, BMI: ${updatedRecord.clinical_features.bmi}, New Risk Score: ${(updatedRecord.model_score * 100).toFixed(1)}% (Rank #${updatedRecord.rank}).`,
  });

  writeDb(db);

  const activePending = db.patientRecords.filter((r) => r.nurse_review_status !== "completed");
  const top100 = activePending.slice(0, 100);

  return { success: found, db, top100 };
}

/**
 * Updates individual patient email dispatch status in persistent DB.
 */
export function updatePatientEmailStatusInDb(
  patientId: string,
  sendState: "delivered" | "failed" | "sending" | "approved",
  messageId?: string,
  sentAt?: string
): { success: boolean; patient?: ScoredPatientRecord } {
  const db = readDb();
  let target: ScoredPatientRecord | undefined;

  db.patientRecords = db.patientRecords.map((r) => {
    if (r.patient_id === patientId) {
      target = {
        ...r,
        email_send_status: sendState,
        message_id: messageId || r.message_id,
        email_sent_at: sentAt || new Date().toISOString(),
      };
      return target;
    }
    return r;
  });

  if (target) {
    db.auditLogs.unshift({
      id: `audit_email_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Automated Email System",
      action: "DISPATCH_EMAILS",
      details: `Individual follow-up email dispatched to patient ${patientId} (${target.patient_email}). Status: ${sendState}. MessageID: ${messageId || 'N/A'}.`,
    });
    writeDb(db);
  }

  return { success: !!target, patient: target };
}

/**
 * Nurse Review Completion action.
 * Marks a patient's nurse review status as "completed".
 * That patient is removed from active worklist, and rank #101+ automatically shifts up into Top 100.
 */
export function markNurseReviewComplete(patientId: string, actor: string = "Triage Nurse"): { success: boolean; updatedPendingCount: number; nextTop100: ScoredPatientRecord[] } {
  const db = readDb();
  let found = false;

  db.patientRecords = db.patientRecords.map((rec) => {
    if (rec.patient_id === patientId) {
      found = true;
      return {
        ...rec,
        nurse_review_status: "completed",
        nurse_reviewed_at: new Date().toISOString(),
        nurse_reviewed_by: actor,
      };
    }
    return rec;
  });

  if (found) {
    db.auditLogs.unshift({
      id: `audit_nurse_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: "SETTINGS_UPDATE",
      details: `Nurse review completed for patient ${patientId}. Next prioritized patient dynamically pulled into active Top 100.`,
    });
    writeDb(db);
  }

  const activePending = db.patientRecords.filter((r) => r.nurse_review_status !== "completed");
  const nextTop100 = activePending.slice(0, 100);

  return {
    success: found,
    updatedPendingCount: activePending.length,
    nextTop100,
  };
}

/**
 * Retrieves the Top 100 active pending records (excluding completed nurse reviews).
 */
export function getActiveTop100(): { top100: ScoredPatientRecord[]; totalPending: number; totalScored: number; hospital: string } {
  const db = readDb();
  const activePending = db.patientRecords.filter((r) => r.nurse_review_status !== "completed");
  const top100 = activePending.slice(0, 100);

  return {
    top100,
    totalPending: activePending.length,
    totalScored: db.patientRecords.length,
    hospital: db.hospitalName,
  };
}

