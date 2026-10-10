import { NextRequest, NextResponse } from "next/server";
import { getActiveTop100, readDb, writeDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { dispatchApprovedBatch } from "@/lib/email-service";
import { addAuditLog } from "@/lib/store";

export async function GET() {
  const { top100, hospital } = getActiveTop100();
  const db = readDb();

  const delivered = top100.filter((r) => r.email_send_status === "delivered").length;
  const failed = top100.filter((r) => r.email_send_status === "failed").length;
  const skipped = top100.filter((r) => r.email_send_status === "skipped").length;
  const pending = top100.length - delivered - failed - skipped;

  return NextResponse.json({
    hospital_name: hospital,
    total_recipients: top100.length,
    is_approved: db.emailApprovalStatus ?? true, // Default enabled for instant dispatch
    approved_by: db.emailApprovedBy || "Clinical Triage Team",
    approved_at: db.emailApprovedAt || new Date().toISOString(),
    is_test_mode: db.isTestMode ?? false,
    stats: {
      delivered,
      failed,
      skipped,
      pending,
    },
    records: top100.map((r) => ({
      patient_id: r.patient_id,
      patient_name: r.patient_name,
      patient_phone: r.patient_phone,
      patient_email: r.patient_email,
      hospital_name: r.hospital_name,
      rank: r.rank,
      priority_tier: r.priority_tier,
      model_score: r.model_score,
      subject: r.patient_email_subject,
      body: r.patient_email_body,
      validation_status: r.email_validation_status,
      send_status: r.email_send_status,
      sent_at: r.email_sent_at,
      error_reason: r.email_error_reason,
      message_id: r.message_id,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Authorized Staff";
    const body = await req.json().catch(() => ({}));
    const { action, is_test_mode } = body;
    const db = readDb();
    const { top100 } = getActiveTop100();

    if (action === "toggle_mode") {
      db.isTestMode = !!is_test_mode;
      writeDb(db);
      addAuditLog(actor, "SETTINGS_UPDATE", `Email delivery mode set to ${is_test_mode ? "Test / Preview Mode" : "Live Provider Mode"}`);
      return NextResponse.json({ success: true, is_test_mode: !!is_test_mode });
    }

    if (action === "approve") {
      db.emailApprovalStatus = true;
      db.emailApprovedBy = actor;
      db.emailApprovedAt = new Date().toISOString();
      writeDb(db);
      addAuditLog(
        actor,
        "APPROVE_EMAIL_BATCH",
        `Approved email batch dispatch of ${top100.length} patient communications for ${db.hospitalName}`
      );
      return NextResponse.json({
        success: true,
        is_approved: true,
        approved_by: actor,
        approved_at: db.emailApprovedAt,
      });
    }

    if (action === "send" || action === "send_all") {
      if (top100.length === 0) {
        return NextResponse.json(
          { success: false, error: "No records found in active Top 100 worklist to dispatch." },
          { status: 400 }
        );
      }

      const batchId = `BATCH_${Date.now()}`;
      const dispatchResults = await dispatchApprovedBatch(top100, {
        batchId,
        hospitalName: db.hospitalName,
        approvedBy: db.emailApprovedBy || actor,
        isTestMode: db.isTestMode ?? false,
      });

      // Update persistent DB patient records with new email send status
      const resultMap = new Map(dispatchResults.results.map((r) => [r.patient_id, r]));

      db.patientRecords = db.patientRecords.map((rec) => {
        const res = resultMap.get(rec.patient_id);
        if (res) {
          return {
            ...rec,
            email_send_status: res.status,
            email_sent_at: res.timestamp,
            email_error_reason: res.error_reason,
            message_id: res.message_id,
            email_retry_count: res.retry_count,
          };
        }
        return rec;
      });

      db.emailApprovalStatus = true;
      writeDb(db);

      return NextResponse.json({
        success: true,
        batch_id: batchId,
        delivered: dispatchResults.delivered,
        failed: dispatchResults.failed,
        skipped: dispatchResults.skipped,
        total: top100.length,
        is_test_mode: db.isTestMode,
        records: getActiveTop100().top100,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Email action failed" }, { status: 500 });
  }
}
