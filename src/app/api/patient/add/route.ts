import { NextRequest, NextResponse } from "next/server";
import { scorePatientRecords } from "@/lib/scoring";
import { addSinglePatientToDb } from "@/lib/db";
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

    const rawRecord = {
      PatientID: String(patient_id).trim(),
      PatientName: String(patient_name || `Patient ${patient_id}`).trim(),
      PatientPhone: String(patient_phone || "+1-555-0199").trim(),
      PatientEmail: String(patient_email || "").trim(),
      HospitalName: "HexaClinic for Diabetes",
      Pregnancies: Number(pregnancies || 0),
      Glucose: Number(glucose || 0),
      BloodPressure: Number(blood_pressure || 0),
      SkinThickness: Number(skin_thickness || 0),
      Insulin: Number(insulin || 0),
      BMI: Number(bmi || 0),
      DiabetesPedigreeFunction: Number(pedigree || 0.1),
      Age: Number(age || 20),
    };

    // Score using real Python ML Random Forest model
    const scoredList = await scorePatientRecords([rawRecord]);
    if (!scoredList || scoredList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to score clinical record." },
        { status: 500 }
      );
    }

    const scoredRecord = scoredList[0];
    const { db, top100 } = addSinglePatientToDb(scoredRecord);

    return NextResponse.json({
      success: true,
      message: `Patient ${scoredRecord.patient_id} (${scoredRecord.patient_name}) saved to database and prioritized at rank #${scoredRecord.rank}.`,
      patient: scoredRecord,
      top100,
      total_records: db.patientRecords.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to add patient to database." },
      { status: 500 }
    );
  }
}
