"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  AlertTriangle,
  Mail,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  ListFilter,
  BarChart2,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/score");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const top100 = data?.top100 || [];
  const totalScored = data?.total_scored || 0;
  const highPriority = top100.filter((r: any) => r.priority_tier === "High Priority").length;
  const moderatePriority = top100.filter((r: any) => r.priority_tier === "Moderate Priority").length;
  const standardPriority = top100.filter((r: any) => r.priority_tier === "Standard Follow-Up").length;
  const missingDataCount = top100.filter((r: any) => !r.quality?.is_reliable).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_30%_30%,rgba(22,125,141,0.3),transparent_70%)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-200 rounded-full text-xs font-semibold mb-2 border border-teal-400/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Clinic: HexaClinic for Diabetes</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              HexaClinic for Diabetes Prioritization Platform
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Upload patient screening workbooks (.xlsx) for real-time Random Forest & Logistic Regression risk scoring trained on benchmark clinical dataset.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/upload"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 border border-teal-400/30"
            >
              <UploadCloud className="w-4 h-4 text-teal-200" />
              <span>Upload Patient Workbook (.xlsx)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Screened Records
            </span>
            <div className="text-2xl font-bold text-navy-900 mt-1">
              {loading ? "..." : totalScored}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Uploaded workbook cohort</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center border border-navy-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Prioritized Worklist
            </span>
            <div className="text-2xl font-bold text-teal-600 mt-1">
              {loading ? "..." : top100.length}
            </div>
            <span className="text-[11px] text-teal-700 font-medium">Top 100 triage selection</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <ListFilter className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              High Priority Callbacks
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {loading ? "..." : highPriority}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Elevated risk predictors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Data Quality Warnings
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {loading ? "..." : missingDataCount}
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">Unrecorded / Imputed values</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Funnel & Model Specs */}
      {totalScored === 0 && !loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100 shadow-xs">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-navy-900">
            No Patient Workbook Uploaded
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please upload your patient screening Excel workbook (.xlsx) containing the 10 required clinical columns to execute real-time model prioritization.
          </p>
          <Link
            href="/upload"
            className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-teal-300" />
            <span>Go to Upload Page</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  Screening Prioritization Funnel
                </h2>
                <p className="text-xs text-slate-500">
                  Deterministic risk deciles derived from real Random Forest model probabilities
                </p>
              </div>
              <Link
                href="/worklist"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
              >
                <span>View Worklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-red-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                    High Priority Triage (&ge; 0.65 Score)
                  </span>
                  <span className="text-slate-700">{highPriority} Patients ({totalScored ? Math.round((highPriority / Math.max(1, top100.length)) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${(highPriority / Math.max(1, top100.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    Moderate Priority Follow-Up (0.40 - 0.64 Score)
                  </span>
                  <span className="text-slate-700">{moderatePriority} Patients ({totalScored ? Math.round((moderatePriority / Math.max(1, top100.length)) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(moderatePriority / Math.max(1, top100.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Standard Routine Follow-Up (&lt; 0.40 Score)
                  </span>
                  <span className="text-slate-700">{standardPriority} Patients ({totalScored ? Math.round((standardPriority / Math.max(1, top100.length)) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(standardPriority / Math.max(1, top100.length)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-navy-900">
              ML Model Specs
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 block">Primary Classification Engine</span>
                <strong className="text-xs font-bold text-navy-900">Random Forest Classifier (150 Trees)</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">5-Fold CV ROC-AUC</span>
                  <strong className="text-sm font-extrabold text-teal-600 font-mono">0.8368</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Brier Calibration</span>
                  <strong className="text-sm font-extrabold text-teal-600 font-mono">0.1683</strong>
                </div>
              </div>
            </div>
            <Link
              href="/model-performance"
              className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-teal-300" />
              <span>Explore Model Performance</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
