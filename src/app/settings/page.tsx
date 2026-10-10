"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Building2,
  Lock,
  Terminal,
  Activity,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  FlaskConical,
  Mail,
} from "lucide-react";
import { AuditLogEntry } from "@/lib/types";

export default function SettingsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [hospitalInput, setHospitalInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAuditData = async () => {
    try {
      const res = await fetch("/api/audit");
      const json = await res.json();
      if (json.logs) setLogs(json.logs);
      if (json.settings) {
        setSettings(json.settings);
        setHospitalInput(json.settings.currentHospital || "HexaClinic");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleSaveHospital = async () => {
    setSaving(true);
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName: hospitalInput }),
      });
      fetchAuditData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Audit Trail & System Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable clinical activity audit log and transactional email provider settings.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          className="p-2 text-slate-500 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
          title="Refresh logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & Clinic Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-teal-600" />
            Clinic Identification Settings
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Clinic Display Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hospitalInput}
                  onChange={(e) => setHospitalInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-navy-900 font-medium"
                />
                <button
                  onClick={handleSaveHospital}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
              <span className="font-bold text-navy-900 block text-[11px] uppercase tracking-wider">
                Configured Staff Account
              </span>
              <div className="flex justify-between font-mono text-[11px] text-slate-700">
                <span>Username: <strong>trashika</strong></span>
                <span>Role: <strong>CLINICAL_TRIAGE_LEAD</strong></span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
              <span className="font-bold text-navy-900 block text-[11px] uppercase tracking-wider">
                Verified Sender Domain
              </span>
              <p className="text-slate-600 text-[11px] font-mono">
                {process.env.MEDISENSE_SENDER_EMAIL || "care-team@hexaclinic.org"}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Immutable Activity Audit Log ({logs.length} Entries)
            </h2>
            <span className="text-[10px] font-mono text-slate-400">RFC-3161 Compliance Ready</span>
          </div>

          <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-navy-900 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-navy-900 whitespace-nowrap">{log.actor}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
