import { NextRequest, NextResponse } from "next/server";
import { scorePatientRecords } from "@/lib/scoring";
import { savePatientRecords, getActiveTop100 } from "@/lib/db";
import { addAuditLog } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Medical Staff";

    const body = await req.json().catch(() => ({}));
    const records = body.records;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No patient records provided. Please upload an Excel workbook or add patients directly." },
        { status: 400 }
      );
    }

    // Score records using real Python ML model
    const scored = await scorePatientRecords(records);
    const hospital = "HexaClinic for Diabetes";

    // Save into persistent database
    savePatientRecords(scored, hospital);

    // Get active Top 100 pending nurse reviews
    const { top100, totalPending, totalScored } = getActiveTop100();

    addAuditLog(
      actor,
      "RUN_SCORING",
      `Executed ML risk prioritization on ${scored.length} records. Active Top 100 worklist updated (${totalPending} total pending).`
    );

    return NextResponse.json({
      success: true,
      total_scored: totalScored,
      total_pending: totalPending,
      top_count: top100.length,
      hospital,
      top100,
      full_summary: {
        high_priority_count: scored.filter((r) => r.priority_tier === "High Priority").length,
        moderate_priority_count: scored.filter((r) => r.priority_tier === "Moderate Priority").length,
        standard_count: scored.filter((r) => r.priority_tier === "Standard Follow-Up").length,
        unreliable_count: scored.filter((r) => !r.quality.is_reliable).length,
      },
    });
  } catch (err: any) {
    console.error("Scoring error:", err);
    return NextResponse.json({ success: false, error: err.message || "Scoring failed" }, { status: 500 });
  }
}

export async function GET() {
  const { top100, totalPending, totalScored, hospital } = getActiveTop100();
  return NextResponse.json({
    total_scored: totalScored,
    total_pending: totalPending,
    top_count: top100.length,
    hospital,
    top100,
  });
}

