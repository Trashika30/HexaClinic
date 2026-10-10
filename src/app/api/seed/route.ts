import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import { getActiveTop100 } from "@/lib/db";

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "seed_db.js");
    execSync(`node "${scriptPath}"`, { cwd: process.cwd() });

    const { top100, totalPending, totalScored } = getActiveTop100();

    return NextResponse.json({
      success: true,
      message: `Database successfully populated with 1,000 ML-scored dummy patient records.`,
      total_scored: totalScored,
      total_pending: totalPending,
      top100,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to seed database" }, { status: 500 });
  }
}
