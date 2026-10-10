"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function ClinicalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg px-3.5 py-2 flex items-center gap-2.5 text-xs text-amber-900 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <p className="leading-snug">
          <strong className="font-semibold text-amber-950">Clinical Notice:</strong> MediSense provides research-based screening follow-up prioritization, not a diagnosis. Clinical decisions remain with qualified healthcare professionals.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-y border-amber-200/90 px-4 py-2.5 text-xs text-amber-950 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-amber-100 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="font-medium text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950 tracking-wide uppercase text-[10px] mr-1.5 px-1.5 py-0.5 bg-amber-200/80 rounded">
              Research Decision Support
            </span>
            MediSense provides research-based screening follow-up prioritization, not a diagnosis. Scores depend on data quality and model limitations. Verify measurements and follow clinic protocol. Clinical decisions remain with qualified healthcare professionals.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Validated Workflow</span>
        </div>
      </div>
    </div>
  );
}
