"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Award,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ModelPerformancePage() {
  const [modelData, setModelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<"random_forest" | "logistic_regression">("random_forest");

  useEffect(() => {
    fetch("/api/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.report) setModelData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const report = modelData?.report;
  const modelCard = modelData?.modelCard;

  const currentEval = report?.models_evaluated?.[activeModel];
  const testMetrics = currentEval?.test_metrics;
  const featureExplanations = currentEval?.feature_explanations || [];
  const cm = testMetrics?.confusion_matrix;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-teal-50 text-teal-800 text-xs font-semibold rounded-md border border-teal-200 mb-1">
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span>Benchmark Dataset: Pima Indians Diabetes (768 Records)</span>
          </div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Machine Learning Evaluation & Model Card
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates scikit-learn models trained with leakage-safe preprocessing and stratified 5-fold cross validation.
          </p>
        </div>

        {/* Model Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveModel("random_forest")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeModel === "random_forest"
                ? "bg-navy-900 text-white shadow-xs"
                : "text-slate-600 hover:text-navy-900"
            }`}
          >
            Random Forest (Primary)
          </button>
          <button
            onClick={() => setActiveModel("logistic_regression")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeModel === "logistic_regression"
                ? "bg-navy-900 text-white shadow-xs"
                : "text-slate-600 hover:text-navy-900"
            }`}
          >
            Logistic Regression
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      {testMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Holdout ROC-AUC</span>
            <strong className="text-xl font-extrabold text-teal-600 font-mono mt-1 block">
              {testMetrics.roc_auc.toFixed(4)}
            </strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">PR-AUC (Avg Prec)</span>
            <strong className="text-xl font-extrabold text-navy-900 font-mono mt-1 block">
              {testMetrics.pr_auc.toFixed(4)}
            </strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Recall / Sensitivity</span>
            <strong className="text-xl font-extrabold text-emerald-600 font-mono mt-1 block">
              {(testMetrics.recall * 100).toFixed(1)}%
            </strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Precision</span>
            <strong className="text-xl font-extrabold text-indigo-600 font-mono mt-1 block">
              {(testMetrics.precision * 100).toFixed(1)}%
            </strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">F1 Score</span>
            <strong className="text-xl font-extrabold text-navy-900 font-mono mt-1 block">
              {testMetrics.f1.toFixed(4)}
            </strong>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Brier Score</span>
            <strong className="text-xl font-extrabold text-amber-600 font-mono mt-1 block">
              {testMetrics.brier_score.toFixed(4)}
            </strong>
          </div>
        </div>
      )}

      {/* Main Breakdown Grid: Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confusion Matrix Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Confusion Matrix (20% Holdout Test Set)
          </h2>

          {cm && (
            <div className="grid grid-cols-2 gap-3 text-center pt-2">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">True Negatives (TN)</span>
                <strong className="text-2xl font-extrabold text-emerald-900 font-mono mt-1 block">{cm.tn}</strong>
                <span className="text-[10px] text-emerald-700">Correctly Identified Non-Priority</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">False Positives (FP)</span>
                <strong className="text-2xl font-extrabold text-amber-900 font-mono mt-1 block">{cm.fp}</strong>
                <span className="text-[10px] text-amber-700">Over-prioritized</span>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold uppercase text-red-800 block">False Negatives (FN)</span>
                <strong className="text-2xl font-extrabold text-red-900 font-mono mt-1 block">{cm.fn}</strong>
                <span className="text-[10px] text-red-700">Under-prioritized</span>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-[10px] font-bold uppercase text-teal-800 block">True Positives (TP)</span>
                <strong className="text-2xl font-extrabold text-teal-900 font-mono mt-1 block">{cm.tp}</strong>
                <span className="text-[10px] text-teal-700">Correctly Prioritized High Risk</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
            <strong>Cross Validation Note:</strong> 5-Fold Stratified CV achieved <strong>{currentEval?.test_metrics?.cv_results?.mean_cv_roc_auc} &plusmn; {currentEval?.test_metrics?.cv_results?.std_cv_roc_auc}</strong> ROC-AUC across training folds.
          </div>
        </div>

        {/* Feature Importance Ranking Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Clinical Predictor Importance & Rationale
          </h2>

          <div className="space-y-3 pt-1">
            {featureExplanations.map((item: any, idx: number) => {
              const val = item.percentage || (Math.abs(item.coefficient || 0) * 20);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-900">{item.feature}</span>
                    <span className="font-mono text-teal-700 font-semibold">
                      {item.percentage ? `${item.percentage}%` : `Odds Ratio: ${item.odds_ratio}`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-navy-900 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, val))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {item.clinical_relevance}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model Card Viewer */}
      {modelCard && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-navy-900">
                Official Model Card ({modelCard.model_name})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">v{modelCard.model_version}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <strong className="text-navy-900 block font-bold text-xs uppercase tracking-wider">Intended Use & Target Users</strong>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {modelCard.intended_use} Intended users: <strong>{modelCard.intended_users}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-navy-900 block font-bold text-xs uppercase tracking-wider">Model Limitations & Data Constraints</strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {modelCard.limitations.map((lim: string, i: number) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
