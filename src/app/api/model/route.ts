import { NextResponse } from "next/server";
import { loadModelReport } from "@/lib/store";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const report = loadModelReport();
    let modelCard = null;

    const cardPath = path.join(process.cwd(), "ml", "saved_models", "model_card.json");
    if (fs.existsSync(cardPath)) {
      modelCard = JSON.parse(fs.readFileSync(cardPath, "utf-8"));
    }

    if (!report) {
      return NextResponse.json({ error: "Model evaluation report not found. Train model first." }, { status: 404 });
    }

    return NextResponse.json({
      report,
      modelCard,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
