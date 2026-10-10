import { NextRequest, NextResponse } from "next/server";
import { readDb, updatePatientEmailStatusInDb } from "@/lib/db";
import { sendPatientEmailDirectly } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { patient_id } = body;

    if (!patient_id) {
      return NextResponse.json(
        { success: false, error: "Patient ID is required." },
        { status: 400 }
      );
    }

    const db = readDb();
    const patient = db.patientRecords.find((r) => r.patient_id === patient_id);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient ID '${patient_id}' not found in database.` },
        { status: 404 }
      );
    }

    if (!patient.patient_email || !patient.patient_email.includes("@")) {
      return NextResponse.json(
        { success: false, error: `Patient ${patient_id} has no valid email address (${patient.patient_email || "blank"}).` },
        { status: 400 }
      );
    }

    // Attempt real SMTP dispatch via trashikabaskaran@gmail.com
    const result = await sendPatientEmailDirectly({
      to: patient.patient_email,
      patientName: patient.patient_name,
      patientId: patient.patient_id,
      subject: patient.patient_email_subject,
      body: patient.patient_email_body,
    });

    if (result.success) {
      updatePatientEmailStatusInDb(
        patient_id,
        "delivered",
        result.messageId,
        result.deliveredAt
      );

      return NextResponse.json({
        success: true,
        message: `Follow-up email dispatched to ${patient.patient_name} (${patient.patient_email}) from trashikabaskaran@gmail.com.`,
        message_id: result.messageId,
        is_simulated: result.isSimulated || false,
      });
    } else {
      updatePatientEmailStatusInDb(patient_id, "failed");
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Email dispatch failed." },
      { status: 500 }
    );
  }
}
