import { NextRequest, NextResponse } from "next/server";
import { scorePatientRecords } from "@/lib/scoring";
import { updatePatientRecordInDb, readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Medical Staff";

    const body = await req.json().catch(() => ({}));
    const {
      patient_id,
      patient_name,
      patient_phone,
      patient_email,
      pregnancies,
      glucose,
      blood_pressure,
      skin_thickness,
      insulin,
      bmi,
      pedigree,
      age,
    } = body;

    if (!patient_id) {
      return NextResponse.json(
        { success: false, error: "Patient ID is required." },
        { status: 400 }
      );
    }

    const db = readDb();
    const existing = db.patientRecords.find((r) => r.patient_id === patient_id);

    const rawRecord = {
      PatientID: String(patient_id).trim(),
      PatientName: String(patient_name || existing?.patient_name || `Patient ${patient_id}`).trim(),
      PatientPhone: String(patient_phone || existing?.patient_phone || "+1-555-0199").trim(),
      PatientEmail: String(patient_email || existing?.patient_email || "").trim(),
      HospitalName: "HexaClinic for Diabetes",
      Pregnancies: Number(pregnancies !== undefined ? pregnancies : existing?.clinical_features.pregnancies || 0),
      Glucose: Number(glucose !== undefined ? glucose : existing?.clinical_features.glucose || 0),
      BloodPressure: Number(blood_pressure !== undefined ? blood_pressure : existing?.clinical_features.blood_pressure || 0),
      SkinThickness: Number(skin_thickness !== undefined ? skin_thickness : existing?.clinical_features.skin_thickness || 0),
      Insulin: Number(insulin !== undefined ? insulin : existing?.clinical_features.insulin || 0),
      BMI: Number(bmi !== undefined ? bmi : existing?.clinical_features.bmi || 0),
      DiabetesPedigreeFunction: Number(pedigree !== undefined ? pedigree : existing?.clinical_features.pedigree || 0.1),
      Age: Number(age !== undefined ? age : existing?.clinical_features.age || 20),
    };

    // Re-score using real Python ML Random Forest model
    const scoredList = await scorePatientRecords([rawRecord]);
    if (!scoredList || scoredList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to score clinical record." },
        { status: 500 }
      );
    }

    const updatedScoredRecord = {
      ...scoredList[0],
      nurse_review_status: existing?.nurse_review_status || "pending",
      nurse_reviewed_at: existing?.nurse_reviewed_at,
      nurse_reviewed_by: existing?.nurse_reviewed_by,
    };

    const { success, top100 } = updatePatientRecordInDb(patient_id, updatedScoredRecord);

    return NextResponse.json({
      success: true,
      message: `Patient ${patient_id} updated & re-scored successfully. New Glucose: ${rawRecord.Glucose} mg/dL, New Risk Score: ${(updatedScoredRecord.model_score * 100).toFixed(1)}% (Rank #${updatedScoredRecord.rank}).`,
      patient: updatedScoredRecord,
      top100,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update patient record." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId) {
    return NextResponse.json({ success: false, error: "patient_id query param is required." }, { status: 400 });
  }

  const db = readDb();
  const patient = db.patientRecords.find((r) => r.patient_id === patientId);

  if (!patient) {
    return NextResponse.json({ success: false, error: `Patient ID '${patientId}' not found.` }, { status: 404 });
  }

  return NextResponse.json({ success: true, patient });
}
