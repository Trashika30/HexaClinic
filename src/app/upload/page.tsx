"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { REQUIRED_COLUMNS } from "@/lib/excel-validator";

export default function ExcelUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFile = async (file: File) => {
    setSelectedFileName(file.name);
    setLoading(true);
    setValidationResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload & Validate
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setValidationResult(data);

      // 2. Automatically score if valid
      if (data.is_valid && data.records && data.records.length > 0) {
        setScoringLoading(true);
        const scoreRes = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: data.records }),
        });
        const scoreData = await scoreRes.json();
        setValidationResult((prev: any) => ({
          ...prev,
          scored: true,
          top_count: scoreData.top_count,
        }));
      }
    } catch (err) {
      console.error(err);
      setValidationResult({
        is_valid: false,
        errors: ["Failed to upload or parse Excel file."],
        warnings: [],
      });
    } finally {
      setLoading(false);
      setScoringLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            Patient Workbook Ingestion
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload patient screening workbook (.xlsx) for schema validation, email verification, and real-time model scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/template"
            download
            className="px-4 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Template</span>
          </a>
        </div>
      </div>

      {/* Upload Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-teal-600 bg-teal-50/50"
            : "border-slate-300 bg-white hover:border-teal-500 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-3 border border-teal-100 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-sm font-bold text-navy-900">
          {selectedFileName ? selectedFileName : "Drop patient workbook (.xlsx) here or click to browse"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          Required 12 columns: <span className="font-mono text-[11px] text-navy-800 font-semibold">{REQUIRED_COLUMNS.join(", ")}</span>
        </p>

        {(loading || scoringLoading) && (
          <div className="mt-4 text-xs font-semibold text-teal-600 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>{loading ? "Parsing & validating workbook structure..." : "Executing real-time ML risk scoring & generating prompts..."}</span>
          </div>
        )}
      </div>

      {/* Validation & Live Scoring Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary Status Box */}
          <div
            className={`p-6 rounded-2xl border shadow-xs ${
              validationResult.is_valid
                ? "bg-emerald-50/80 border-emerald-200"
                : "bg-red-50/80 border-red-200"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {validationResult.is_valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}

                <div>
                  <h3 className={`text-base font-bold ${validationResult.is_valid ? "text-emerald-950" : "text-red-950"}`}>
                    {validationResult.is_valid
                      ? `Workbook Processed & Scored Successfully (${validationResult.valid_rows} Patients)`
                      : "Workbook Validation Errors Found"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      Clinic: <strong>HexaClinic for Diabetes</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>Total Rows Processed: <strong>{validationResult.total_rows}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span>Prioritized Worklist: <strong className="text-teal-700 font-bold">{validationResult.top_count || Math.min(100, validationResult.valid_rows)} Patients</strong></span>
                  </div>
                </div>
              </div>

              {validationResult.is_valid && (
                <button
                  onClick={() => router.push("/worklist")}
                  className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <span>View Prioritized Callback Worklist</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              )}
            </div>

            {/* Error List */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="mt-4 p-3.5 bg-white/90 rounded-xl border border-red-200 space-y-1">
                <span className="text-xs font-bold text-red-900 block mb-1">Critical Validation Errors:</span>
                {validationResult.errors.map((err: string, i: number) => (
                  <p key={i} className="text-xs text-red-700 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Warning List */}
            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="mt-4 p-3.5 bg-white/90 rounded-xl border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-900 block mb-1">Data Quality Warnings:</span>
                <p className="text-xs text-amber-800">
                  {validationResult.warnings.length} warning(s) detected (e.g. unrecorded insulin, missing glucose). Unrecorded parameters are imputed using cohort median values computed strictly from the Pima training fold during ML inference.
                </p>
              </div>
            )}
          </div>

          {/* Preview Table */}
          {validationResult.records && validationResult.records.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">
                    Uploaded Dataset Preview (First 10 rows)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified 12 columns: PatientID, PatientName, PatientPhone, Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, Pedigree, Age, PatientEmail.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  Rows 1 - 10 of {validationResult.records.length}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-navy-900 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">PatientID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">Age</th>
                      <th className="py-2.5 px-3">Glucose</th>
                      <th className="py-2.5 px-3">BMI</th>
                      <th className="py-2.5 px-3">BP</th>
                      <th className="py-2.5 px-3">Insulin</th>
                      <th className="py-2.5 px-3">PatientEmail</th>
                      <th className="py-2.5 px-3">Email Syntax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {validationResult.records.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-navy-900 font-bold">{row.PatientID}</td>
                        <td className="py-2.5 px-3 font-semibold text-navy-900">{row.PatientName}</td>
                        <td className="py-2.5 px-3 font-mono">{row.PatientPhone || "N/A"}</td>
                        <td className="py-2.5 px-3">{row.Age}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {row.Glucose === 0 ? (
                            <span className="text-amber-700 font-bold" title="Unrecorded / Imputed">0 (NaN)</span>
                          ) : (
                            `${row.Glucose} mg/dL`
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {row.BMI === 0 ? (
                            <span className="text-amber-700 font-bold" title="Unrecorded / Imputed">0.0 (NaN)</span>
                          ) : (
                            row.BMI
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{row.BloodPressure}</td>
                        <td className="py-2.5 px-3 font-mono">{row.Insulin}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{row.PatientEmail}</td>
                        <td className="py-2.5 px-3">
                          {row.isEmailValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <XCircle className="w-3 h-3" /> Invalid Syntax
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
