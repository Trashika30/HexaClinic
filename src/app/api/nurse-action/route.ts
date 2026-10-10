import { NextRequest, NextResponse } from "next/server";
import { markNurseReviewComplete } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Triage Nurse";

    const body = await req.json().catch(() => ({}));
    const { patient_id, action } = body;

    if (!patient_id) {
      return NextResponse.json(
        { success: false, error: "Patient ID is required." },
        { status: 400 }
      );
    }

    if (action === "mark_complete" || action === "done") {
      const result = markNurseReviewComplete(patient_id, actor);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: `Patient ID '${patient_id}' not found in database.` },
          { status: 444 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Nurse review completed for patient ${patient_id}. Next patient in queue dynamically promoted to Top 100.`,
        total_pending: result.updatedPendingCount,
        top100: result.nextTop100,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action '${action}'. Expected 'mark_complete'.` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process nurse action." },
      { status: 500 }
    );
  }
}
