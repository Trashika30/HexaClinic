import { NextRequest, NextResponse } from "next/server";
import { getState, updateState, addAuditLog } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const state = getState();
  return NextResponse.json({
    logs: state.auditLogs,
    settings: {
      currentHospital: state.currentHospital,
      isTestMode: state.isTestMode,
      emailApproved: state.emailApprovalStatus,
      emailApprovedBy: state.emailApprovedBy,
      lastUpload: state.lastUploadTimestamp,
      lastScoring: state.lastScoredTimestamp,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Authorized Staff";
    const body = await req.json();

    if (body.hospitalName) {
      updateState({ currentHospital: body.hospitalName });
      addAuditLog(actor, "SETTINGS_UPDATE", `Updated default hospital name to '${body.hospitalName}'`);
    }

    if (typeof body.isTestMode === "boolean") {
      updateState({ isTestMode: body.isTestMode });
      addAuditLog(actor, "SETTINGS_UPDATE", `Toggled test mode to ${body.isTestMode}`);
    }

    return NextResponse.json({ success: true, settings: getState() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
