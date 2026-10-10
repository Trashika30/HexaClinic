import { NextResponse } from "next/server";
import { generateExcelTemplate } from "@/lib/excel-validator";

export async function GET() {
  try {
    const templateBytes = generateExcelTemplate();

    return new NextResponse(Buffer.from(templateBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="MediSense_Patient_Upload_Template.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
