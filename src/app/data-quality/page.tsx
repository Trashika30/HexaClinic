"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  Database,
  Filter,
  Info,
} from "lucide-react";
import { ScoredPatientRecord } from "@/lib/types";

export default function DataQualityPage() {
  const [records, setRecords] = useState<ScoredPatientRecord[]>([]);
  const [hospital, setHospital] = useState("HexaClinic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/score")
      .then((res) => res.json())
      .then((data) => {
        if (data.top100) {
          setRecords(data.top100);
          if (data.hospital) setHospital(data.hospital);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRecords = records.length;
  const reliableCount = records.filter((r) => r.quality.is_reliable).length;
  const zeroGlucose = records.filter((r) => r.clinical_features.glucose === 0).length;
  const zeroBMI = records.filter((r) => r.clinical_features.bmi === 0).length;
  const zeroBP = records.filter((r) => r.clinical_features.blood_pressure === 0).length;
  const zeroInsulin = records.filter((r) => r.clinical_features.insulin === 0).length;
  const zeroSkin = records.filter((r) => r.clinical_features.skin_thickness === 0).length;
  const invalidEmailCount = records.filter((r) => r.email_validation_status !== "valid").length;

  const flaggedRecords = records.filter((r) => !r.quality.is_reliable || r.quality.flag_count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-xs font-semibold rounded-md border border-indigo-200 mb-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Clinic Cohort: {hospital}</span>
          </div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            Data Quality & Hygiene Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitors unrecorded biological zeros, missing measurements, and email syntax validity for cohort records.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Data Reliability Rate</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {totalRecords ? `${Math.round((reliableCount / totalRecords) * 100)}%` : "N/A"}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">{reliableCount} of {totalRecords} fully recorded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Zero Insulin Flags</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {zeroInsulin}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Imputed via cohort median</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Zero Glucose / BMI</span>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {zeroGlucose + zeroBMI}
          </div>
          <span className="text-[11px] text-red-700 font-medium">Critical physiological indicators</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Validation Issues</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {invalidEmailCount}
          </div>
          <span className="text-[11px] text-indigo-700 font-medium">Blocked from bulk dispatch</span>
        </div>
      </div>

      {/* Explanatory Box on Leakage-Safe Imputation */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-6 space-y-2 text-indigo-950">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
          <Database className="w-4 h-4 text-indigo-700" />
          <span>Leakage-Safe Preprocessing & Imputation Strategy</span>
        </div>
        <p className="text-xs leading-relaxed text-indigo-900">
          In clinical screening workbooks, a zero value for parameters such as <strong>Glucose</strong>, <strong>Insulin</strong>, <strong>BloodPressure</strong>, or <strong>BMI</strong> represents an unrecorded measurement rather than a true zero value. To prevent data leakage during machine learning inference, MediSense replaces zeros with missing values (`NaN`) and imputes them using cohort median statistics fitted strictly on the Pima training split. Records with imputed primary indicators are flagged for nurse measurement verification.
        </p>
      </div>

      {/* Flagged Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-900">
            Flagged Patient Records ({flaggedRecords.length})
          </h2>
          <span className="text-xs text-slate-500">
            Records requiring clinical measurement verification
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-navy-900 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">PatientID</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Glucose</th>
                <th className="py-2.5 px-3">BMI</th>
                <th className="py-2.5 px-3">Insulin</th>
                <th className="py-2.5 px-3">Quality Flags</th>
                <th className="py-2.5 px-3">Email Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {flaggedRecords.map((rec) => (
                <tr key={rec.patient_id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-navy-900">{rec.patient_id}</td>
                  <td className="py-2.5 px-3">{rec.clinical_features.age} yrs</td>
                  <td className="py-2.5 px-3 font-mono">
                    {rec.clinical_features.glucose === 0 ? (
                      <span className="text-red-700 font-bold">0 (Imputed)</span>
                    ) : (
                      `${rec.clinical_features.glucose} mg/dL`
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {rec.clinical_features.bmi === 0 ? (
                      <span className="text-red-700 font-bold">0.0 (Imputed)</span>
                    ) : (
                      rec.clinical_features.bmi
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {rec.clinical_features.insulin === 0 ? (
                      <span className="text-amber-700 font-bold">0 (Imputed)</span>
                    ) : (
                      rec.clinical_features.insulin
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {rec.quality.flags.map((flag, idx) => (
                        <span key={idx} className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {rec.email_validation_status === "valid" ? (
                      <span className="text-emerald-700 font-bold text-[10px]">Valid</span>
                    ) : (
                      <span className="text-red-700 font-bold text-[10px]">Invalid Email</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
