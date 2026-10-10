import { NextRequest, NextResponse } from "next/server";
import { parseAndValidateWorkbook } from "@/lib/excel-validator";
import { addAuditLog, updateState } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const actor = user?.username || "Medical Staff";

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { is_valid: false, errors: ["Invalid content type. Multipart form data required."] },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { is_valid: false, errors: ["No file uploaded."] },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const validationResult = parseAndValidateWorkbook(buffer);

    if (validationResult.is_valid) {
      updateState({
        currentHospital: "HexaClinic for Diabetes",
        lastUploadTimestamp: new Date().toISOString(),
      });
      addAuditLog(
        actor,
        "UPLOAD_WORKBOOK",
        `Uploaded and validated workbook '${file.name}' with ${validationResult.valid_rows} valid patient records.`
      );
    } else {
      addAuditLog(
        actor,
        "UPLOAD_WORKBOOK",
        `Workbook validation failed for '${file.name}': ${validationResult.errors.join("; ")}`
      );
    }

    return NextResponse.json(validationResult);
  } catch (err: any) {
    return NextResponse.json(
      { is_valid: false, errors: [err.message || "Failed to process workbook."] },
      { status: 500 }
    );
  }
}
