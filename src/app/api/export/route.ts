import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getState, addAuditLog } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Medical Staff";
    const state = getState();

    const records = state.top100Records;
    if (records.length === 0) {
      return NextResponse.json({ error: "No prioritized records to export. Please upload an Excel workbook and run scoring first." }, { status: 400 });
    }

    // Build worksheet data with PatientName and PatientPhone
    const exportData = records.map((rec) => ({
      Rank: rec.rank,
      PatientID: rec.patient_id,
      PatientName: rec.patient_name,
      PatientPhone: rec.patient_phone,
      PriorityTier: rec.priority_tier,
      ModelDerivedScore: rec.model_score,
      SecondaryLRScore: rec.secondary_lr_score,
      Age: rec.clinical_features.age,
      Glucose_mg_dL: rec.clinical_features.glucose,
      BloodPressure_mmHg: rec.clinical_features.blood_pressure,
      BMI: rec.clinical_features.bmi,
      Insulin_muU_mL: rec.clinical_features.insulin,
      SkinThickness_mm: rec.clinical_features.skin_thickness,
      Pregnancies: rec.clinical_features.pregnancies,
      PedigreeFunction: rec.clinical_features.pedigree,
      DataQualityReliable: rec.quality.is_reliable ? "Yes" : "Caution (Imputed)",
      QualityFlags: rec.quality.flags.join("; "),
      NurseDiscussionPrompt: rec.nurse_prompt,
      PatientEmail: rec.patient_email,
      EmailSubject: rec.patient_email_subject,
      PatientEmailMessage: rec.patient_email_body,
      EmailValidationStatus: rec.email_validation_status,
      EmailDeliveryStatus: rec.email_send_status,
      EmailDeliveredAt: rec.email_sent_at || "Not dispatched",
      DeliveryMessageID: rec.message_id || "N/A",
      ClinicalDisclaimer: "HexaClinic for Diabetes research-based screening prioritization, not a diagnosis. Qualified clinician review required."
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top100_Prioritized_Worklist");

    const wbBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    addAuditLog(actor, "EXPORT_EXCEL", `Exported ${records.length} prioritized records to Excel workbook.`);

    return new NextResponse(wbBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="HexaClinic_Diabetes_Top100_Prioritization_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to export Excel" }, { status: 500 });
  }
}
