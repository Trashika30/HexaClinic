import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { ScoredPatientRecord, DataQualityReport, ClinicalFeatures } from "./types";
import { generateNursePrompt, generatePatientEmail } from "./message-generator";
import { validateEmail } from "./excel-validator";

const PYTHON_PATH = "C:\\Users\\acer\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe";
const SCRIPT_PATH = path.join(process.cwd(), "ml", "infer.py");

/**
 * Invokes the real Python machine learning model to score uploaded patient records.
 * Never uses Outcome, PatientID, PatientName, or PatientEmail as predictors.
 */
export async function scorePatientRecords(records: any[]): Promise<ScoredPatientRecord[]> {
  if (!records || records.length === 0) return [];

  // Call python infer.py
  const scoredRaw: any[] = await runPythonInference(records);

  // Map into full ScoredPatientRecord objects
  const scoredRecords: ScoredPatientRecord[] = scoredRaw.map((rec) => {
    const pId = rec.patient_id;
    const pName = rec.patient_name || `Patient ${pId}`;
    const email = rec.patient_email;
    const hospital = rec.hospital_name || "HexaClinic for Diabetes";
    const features: ClinicalFeatures = rec.clinical_features;

    const quality: DataQualityReport = {
      flags: rec.quality.flags || [],
      is_reliable: rec.quality.is_reliable,
      flag_count: rec.quality.flag_count,
      has_implausible_glucose: features.glucose === 0,
      has_implausible_bmi: features.bmi === 0,
      has_implausible_bp: features.blood_pressure === 0,
      missing_measurements: [
        ...(features.glucose === 0 ? ["Glucose"] : []),
        ...(features.blood_pressure === 0 ? ["BloodPressure"] : []),
        ...(features.skin_thickness === 0 ? ["SkinThickness"] : []),
        ...(features.insulin === 0 ? ["Insulin"] : []),
        ...(features.bmi === 0 ? ["BMI"] : []),
      ],
    };

    // Generate individualized nurse discussion prompt
    const nursePrompt = generateNursePrompt(pId, pName, features, quality, hospital);

    // Generate patient-facing email message
    const { subject, body } = generatePatientEmail(pId, pName, hospital);

    const isEmailValid = validateEmail(email);

    const pPhone = rec.patient_phone || rec.PatientPhone || "+1-555-0199";

    return {
      patient_id: pId,
      patient_name: pName,
      patient_phone: pPhone,
      patient_email: email,
      hospital_name: hospital,
      model_score: rec.model_score,
      secondary_lr_score: rec.secondary_lr_score,
      priority_tier: rec.priority_tier,
      clinical_features: features,
      key_highlights: rec.key_highlights || [],
      quality,
      rank: rec.rank,
      nurse_review_status: rec.nurse_review_status || "pending",
      nurse_prompt: nursePrompt,
      patient_email_subject: subject,
      patient_email_body: body,
      email_validation_status: !email ? "missing" : isEmailValid ? "valid" : "invalid_format",
      email_send_status: "pending_review",
    };
  });

  return scoredRecords;
}

/**
 * Executes Python child process passing records via stdin JSON
 */
function runPythonInference(records: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const pythonExe = fs.existsSync(PYTHON_PATH) ? PYTHON_PATH : "python";
    const child = spawn(pythonExe, [SCRIPT_PATH], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("Python infer.py stderr:", stderr);
        return reject(new Error(`Inference engine failed with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse ML inference JSON response: ${err}. Raw stdout: ${stdout.slice(0, 300)}`));
      }
    });

    child.stdin.write(JSON.stringify(records));
    child.stdin.end();
  });
}
