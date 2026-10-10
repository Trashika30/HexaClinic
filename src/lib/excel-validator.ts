import * as XLSX from "xlsx";
import { ExcelValidationResult } from "./types";

export const REQUIRED_COLUMNS = [
  "PatientID",
  "PatientName",
  "PatientPhone",
  "Pregnancies",
  "Glucose",
  "BloodPressure",
  "SkinThickness",
  "Insulin",
  "BMI",
  "DiabetesPedigreeFunction",
  "Age",
  "PatientEmail",
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

export function parseAndValidateWorkbook(
  workbookData: ArrayBuffer | Uint8Array | Buffer
): ExcelValidationResult {
  const wb = XLSX.read(workbookData, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {
      is_valid: false,
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      hospital_name: "HexaClinic for Diabetes",
      hospital_name_consistent: true,
      detected_hospitals: ["HexaClinic for Diabetes"],
      errors: ["Workbook contains no worksheets."],
      warnings: [],
      duplicate_patient_ids: [],
      duplicate_emails: [],
      records: [],
    };
  }

  const sheet = wb.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return {
      is_valid: false,
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      hospital_name: "HexaClinic for Diabetes",
      hospital_name_consistent: true,
      detected_hospitals: ["HexaClinic for Diabetes"],
      errors: ["The uploaded worksheet is empty."],
      warnings: [],
      duplicate_patient_ids: [],
      duplicate_emails: [],
      records: [],
    };
  }

  // Check headers
  const firstRowKeys = Object.keys(rawRows[0]);
  const headerMap: { [requiredCol: string]: string } = {};
  const missingColumns: string[] = [];

  for (const reqCol of REQUIRED_COLUMNS) {
    const found = firstRowKeys.find(
      (k) => k.trim().toLowerCase() === reqCol.toLowerCase()
    );
    if (found) {
      headerMap[reqCol] = found;
    } else {
      missingColumns.push(reqCol);
    }
  }

  if (missingColumns.length > 0) {
    return {
      is_valid: false,
      total_rows: rawRows.length,
      valid_rows: 0,
      invalid_rows: rawRows.length,
      hospital_name: "HexaClinic for Diabetes",
      hospital_name_consistent: true,
      detected_hospitals: ["HexaClinic for Diabetes"],
      errors: [`Missing required columns: ${missingColumns.join(", ")}`],
      warnings: [],
      duplicate_patient_ids: [],
      duplicate_emails: [],
      records: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const seenPatientIds = new Set<string>();
  const seenEmails = new Set<string>();
  const duplicatePatientIds: string[] = [];
  const duplicateEmails: string[] = [];
  const processedRecords: any[] = [];
  const primaryHospital = "HexaClinic for Diabetes";

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed header + 1
    const pId = String(row[headerMap["PatientID"]] || "").trim();
    const pName = String(row[headerMap["PatientName"]] || "").trim();
    const pPhone = String(row[headerMap["PatientPhone"]] || "").trim();
    const email = String(row[headerMap["PatientEmail"]] || "").trim();

    // Check PatientID
    if (!pId) {
      errors.push(`Row ${rowNum}: PatientID is missing.`);
    } else if (seenPatientIds.has(pId)) {
      duplicatePatientIds.push(pId);
      warnings.push(`Row ${rowNum}: Duplicate PatientID '${pId}' detected.`);
    } else {
      seenPatientIds.add(pId);
    }

    // Check PatientPhone
    if (!pPhone) {
      warnings.push(`Row ${rowNum} (${pId}): PatientPhone is unrecorded.`);
    }

    // Check PatientEmail
    const isEmailValid = validateEmail(email);
    if (!email) {
      errors.push(`Row ${rowNum}: PatientEmail is missing.`);
    } else if (!isEmailValid) {
      errors.push(`Row ${rowNum}: Invalid email format '${email}'.`);
    } else if (seenEmails.has(email.toLowerCase())) {
      duplicateEmails.push(email);
      warnings.push(`Row ${rowNum}: Duplicate email '${email}' detected.`);
    } else {
      seenEmails.add(email.toLowerCase());
    }

    // Parse Clinical Features
    const preg = Number(row[headerMap["Pregnancies"]]) || 0;
    const gluc = Number(row[headerMap["Glucose"]]) || 0;
    const bp = Number(row[headerMap["BloodPressure"]]) || 0;
    const skin = Number(row[headerMap["SkinThickness"]]) || 0;
    const ins = Number(row[headerMap["Insulin"]]) || 0;
    const bmi = Number(row[headerMap["BMI"]]) || 0;
    const ped = Number(row[headerMap["DiabetesPedigreeFunction"]]) || 0;
    const age = Number(row[headerMap["Age"]]) || 0;

    // Biological zero checks
    const missingMeasures: string[] = [];
    if (gluc === 0) missingMeasures.push("Glucose");
    if (bp === 0) missingMeasures.push("BloodPressure");
    if (skin === 0) missingMeasures.push("SkinThickness");
    if (ins === 0) missingMeasures.push("Insulin");
    if (bmi === 0) missingMeasures.push("BMI");

    if (missingMeasures.length > 0) {
      warnings.push(`Row ${rowNum} (${pId}): Unrecorded parameters in ${missingMeasures.join(", ")}`);
    }

    processedRecords.push({
      PatientID: pId,
      PatientName: pName || `Patient ${pId}`,
      PatientPhone: pPhone || "+1-555-0199",
      Pregnancies: preg,
      Glucose: gluc,
      BloodPressure: bp,
      SkinThickness: skin,
      Insulin: ins,
      BMI: bmi,
      DiabetesPedigreeFunction: ped,
      Age: age,
      PatientEmail: email,
      HospitalName: primaryHospital,
      isEmailValid,
      missingMeasures,
      rawRowIndex: rowNum,
    });
  });

  const isValid = errors.length === 0;

  return {
    is_valid: isValid,
    total_rows: rawRows.length,
    valid_rows: isValid ? rawRows.length : processedRecords.filter((r) => r.isEmailValid && r.PatientID).length,
    invalid_rows: rawRows.length - processedRecords.filter((r) => r.isEmailValid && r.PatientID).length,
    hospital_name: primaryHospital,
    hospital_name_consistent: true,
    detected_hospitals: [primaryHospital],
    errors,
    warnings,
    duplicate_patient_ids: Array.from(new Set(duplicatePatientIds)),
    duplicate_emails: Array.from(new Set(duplicateEmails)),
    records: processedRecords,
  };
}

/**
 * Creates a standard downloadable Excel template with PatientPhone column included
 */
export function generateExcelTemplate(): Uint8Array {
  const sampleData = [
    {
      PatientID: "PAT-001",
      PatientName: "Jane Doe",
      PatientPhone: "+1-555-0148",
      Pregnancies: 6,
      Glucose: 148,
      BloodPressure: 72,
      SkinThickness: 35,
      Insulin: 0,
      BMI: 33.6,
      DiabetesPedigreeFunction: 0.627,
      Age: 50,
      PatientEmail: "jane.doe@example.com",
    },
    {
      PatientID: "PAT-002",
      PatientName: "Alice Smith",
      PatientPhone: "+1-555-0185",
      Pregnancies: 1,
      Glucose: 85,
      BloodPressure: 66,
      SkinThickness: 29,
      Insulin: 0,
      BMI: 26.6,
      DiabetesPedigreeFunction: 0.351,
      Age: 31,
      PatientEmail: "alice.smith@example.com",
    },
    {
      PatientID: "PAT-003",
      PatientName: "Maria Garcia",
      PatientPhone: "+1-555-0192",
      Pregnancies: 8,
      Glucose: 183,
      BloodPressure: 64,
      SkinThickness: 0,
      Insulin: 0,
      BMI: 23.3,
      DiabetesPedigreeFunction: 0.672,
      Age: 32,
      PatientEmail: "maria.garcia@example.com",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: REQUIRED_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PatientRecords");

  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(wbOut);
}
