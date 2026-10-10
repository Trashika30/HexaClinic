import { ClinicalFeatures, DataQualityReport } from "./types";

/**
 * Generates an individualized, concise, non-diagnostic nurse discussion prompt
 * tailored strictly to verified recorded measurements.
 */
export function generateNursePrompt(
  patientId: string,
  patientName: string,
  features: ClinicalFeatures,
  quality: DataQualityReport,
  hospitalName: string
): string {
  const parts: string[] = [];
  const displayName = patientName && patientName !== patientId ? `${patientId} - ${patientName}` : patientId;

  // Verified clinical metrics
  if (features.glucose > 0) {
    if (features.glucose >= 140) {
      parts.push(`Recorded plasma glucose is elevated at ${features.glucose} mg/dL`);
    } else if (features.glucose >= 100) {
      parts.push(`Recorded plasma glucose is borderline at ${features.glucose} mg/dL`);
    } else {
      parts.push(`Recorded plasma glucose is ${features.glucose} mg/dL`);
    }
  } else {
    parts.push(`Fasting glucose was unrecorded (requires laboratory verification)`);
  }

  if (features.bmi > 0) {
    if (features.bmi >= 30) {
      parts.push(`BMI is ${features.bmi.toFixed(1)} kg/m²`);
    } else if (features.bmi >= 25) {
      parts.push(`BMI is ${features.bmi.toFixed(1)} kg/m²`);
    }
  }

  if (features.blood_pressure > 0 && features.blood_pressure >= 90) {
    parts.push(`diastolic BP elevated at ${features.blood_pressure} mm Hg`);
  }

  if (features.pedigree >= 0.6) {
    parts.push(`family metabolic history noted (pedigree index ${features.pedigree.toFixed(2)})`);
  }

  if (features.age >= 45) {
    parts.push(`patient age ${features.age}`);
  }

  // Quality warnings for the nurse
  const qualityNotes: string[] = [];
  if (quality.missing_measurements.length > 0) {
    qualityNotes.push(`Note unrecorded parameters: ${quality.missing_measurements.join(", ")}`);
  }

  const clinicalSummary = parts.length > 0 ? parts.join("; ") : `Screening record on file for age ${features.age}`;
  const qualityAppendix = qualityNotes.length > 0 ? ` [Data Note: ${qualityNotes.join("; ")}].` : "";

  return `Nurse Discussion Focus (${displayName}): Patient record indicates ${clinicalSummary}.${qualityAppendix} Recommend clinical outreach to review current lifestyle, verify recent laboratory measurements, and coordinate a physician appointment at ${hospitalName} for formal clinical assessment per clinic protocol.`;
}

/**
 * Generates an individualized, respectful, patient-facing email message
 * strictly adhering to non-diagnostic healthcare communication guidelines.
 */
export function generatePatientEmail(
  patientId: string,
  patientName: string,
  hospitalName: string
): { subject: string; body: string } {
  const displayName = patientName || `Patient ${patientId}`;
  const subject = `Follow-up from ${hospitalName}`;
  const body = `Dear ${displayName} (ID: ${patientId}),

Thank you for participating in the recent health screening program organized in partnership with ${hospitalName}.

Our clinical care team has reviewed your completed screening submission. To support your ongoing health and well-being, ${hospitalName} recommends scheduling a follow-up consultation with a healthcare professional for an appropriate individual clinical assessment.

A routine doctor visit allows your medical provider to review your current overall health, discuss any questions you may have, and recommend standard confirmatory tests if appropriate.

To schedule your follow-up appointment:
- Contact our clinic reception at ${hospitalName}
- Or reply directly to this communication with your preferred days and times

Our team is dedicated to supporting your health journey.

Warm regards,

Clinical Care Team
${hospitalName}

--------------------------------------------------
Confidentiality & Clinical Notice: This message is intended solely for the designated recipient. HexaClinic for Diabetes screening follow-up prioritization is a research-based clinical workflow support tool and does not provide medical diagnoses. All diagnostic and clinical care decisions are made by qualified medical professionals.`;

  return { subject, body };
}
