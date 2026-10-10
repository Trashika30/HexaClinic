"use client";

import React, { useState, useEffect } from "react";
import {
  MailCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Eye,
  Lock,
  RefreshCw,
  Mail,
  User,
  Phone,
  Sparkles,
  Info,
  Key,
} from "lucide-react";

export default function EmailReviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingSingleId, setSendingSingleId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const fetchEmailState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailState();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Dispatch Email to EVERYONE in Top 100
  const handleDispatchAll = async () => {
    if (!confirm("Are you sure you want to dispatch follow-up emails to ALL active Top 100 patients?")) return;
    setSendingAll(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_all" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Successfully dispatched emails to ${json.delivered || json.total} patients!`);
        fetchEmailState();
      } else {
        alert(`Error sending emails: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Failed to dispatch batch: ${err.message}`);
    } finally {
      setSendingAll(false);
    }
  };

  // Dispatch Email to INDIVIDUAL Patient
  const handleSendSingleEmail = async (patientId: string, email: string, name: string) => {
    if (!email || !email.includes("@")) {
      alert(`Patient ${patientId} does not have a valid email address.`);
      return;
    }
    setSendingSingleId(patientId);
    try {
      const res = await fetch("/api/email/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`📧 Follow-up email sent to ${name} (${email}) from trashikabaskaran@gmail.com!`);
        fetchEmailState();
      } else {
        alert(`Email error: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setSendingSingleId(null);
    }
  };

  const stats = data?.stats || { delivered: 0, failed: 0, skipped: 0, pending: 0 };
  const records = data?.records || [];

  function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "unregistered@domain.com";
    const [local, domain] = email.split("@");
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in text-xs font-bold border border-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-100 hover:text-white p-1">
            &times;
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 text-xs font-extrabold rounded-lg border border-teal-200 mb-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Clinic: HexaClinic for Diabetes</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2.5 tracking-tight">
            <MailCheck className="w-6 h-6 text-teal-600" />
            Patient Email Automation & Communication Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review and dispatch individualized screening follow-up emails to all Top 100 prioritized patients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Send to Everyone Button */}
          <button
            onClick={handleDispatchAll}
            disabled={sendingAll || records.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {sendingAll ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" /> : <Send className="w-4 h-4 text-indigo-200" />}
            <span>Send Email to Everyone (Top 100)</span>
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Why Gmail Security Notice</span>
          </button>

          <button
            onClick={fetchEmailState}
            className="p-2.5 text-slate-500 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Explanation Banner: Why Email Automation requires Gmail App Password */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Why Standard Gmail Passwords Fail for Automation & How to Enable Live Sending</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed font-medium">
          In 2022, <strong>Google permanently disabled direct password logins</strong> for automated SMTP sending on <code>@gmail.com</code> accounts to prevent unauthorized access. If you pass a standard Gmail account password (e.g. <code>trashikacat*5</code>), Google's SMTP server returns <code>5.7.8 Username and Password not accepted</code>.
        </p>
        <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Fix in 30 Seconds:</strong> Generate a 16-character <strong>Google App Password</strong> under Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords.</span>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg shrink-0"
          >
            Setup Guide
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Top 100 Recipients</span>
          <strong className="text-2xl font-black text-navy-900 font-mono">{records.length}</strong>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs text-center">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Emails Dispatched</span>
          <strong className="text-2xl font-black text-emerald-900 font-mono">{stats.delivered}</strong>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs text-center">
          <span className="text-[10px] text-amber-800 uppercase font-bold block mb-1">Pending Delivery</span>
          <strong className="text-2xl font-black text-amber-900 font-mono">{stats.pending}</strong>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Skipped / Duplicates</span>
          <strong className="text-2xl font-black text-slate-700 font-mono">{stats.skipped}</strong>
        </div>
      </div>

      {/* Patient Communications Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-extrabold text-navy-900 text-xs">
            Showing all <strong>{records.length}</strong> prioritized patient email communications
          </span>
          <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            Sender: trashikabaskaran@gmail.com
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-navy-900 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3">Rank</th>
                <th className="py-3.5 px-3">Patient ID</th>
                <th className="py-3.5 px-3">Patient Name</th>
                <th className="py-3.5 px-3">Recipient Email</th>
                <th className="py-3.5 px-3">Subject & Message Content</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Send Email Option</th>
                <th className="py-3.5 px-3 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {records.map((rec: any) => {
                const isSendingThis = sendingSingleId === rec.patient_id;
                return (
                  <tr key={rec.patient_id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-navy-900 font-extrabold">#{rec.rank}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-navy-900">{rec.patient_id}</td>
                    <td className="py-3.5 px-3 font-bold text-navy-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{rec.patient_name || `Patient ${rec.patient_id}`}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">{rec.patient_email}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                      <strong className="text-navy-900">{rec.subject}</strong>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {rec.send_status === "delivered" ? (
                        <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-300">
                          Delivered
                        </span>
                      ) : rec.send_status === "failed" ? (
                        <span className="text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-red-300">
                          Failed
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-200">
                          Pending Dispatch
                        </span>
                      )}
                    </td>

                    {/* Send Email Option (Individual) */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleSendSingleEmail(rec.patient_id, rec.patient_email, rec.patient_name)}
                        disabled={isSendingThis}
                        className={`px-3 py-1.5 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 mx-auto ${
                          rec.send_status === "delivered"
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                        }`}
                        title="Send follow-up email directly to this patient from trashikabaskaran@gmail.com"
                      >
                        {isSendingThis ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-200" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-indigo-200" />
                        )}
                        <span>{rec.send_status === "delivered" ? "Resend" : "Send Email"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedPreview(rec)}
                        className="p-1.5 text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                        title="Preview Message Copy"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration & Explanation Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">Email Automation Explanation & Setup</h3>
                  <p className="text-xs text-slate-500">Why Gmail blocks standard passwords & how to enable instant sending.</p>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-navy-900 p-1 rounded-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-red-950 space-y-1">
                <h4 className="font-extrabold text-red-900 text-xs">Why Plain Gmail Passwords Are Blocked by Google</h4>
                <p>
                  Google enforces strict OAuth2 and App Password security rules for all <code>@gmail.com</code> addresses. Standard account passwords like <code>trashikacat*5</code> are rejected by Google SMTP with error <code>5.7.8 Username and Password not accepted</code>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <h4 className="font-extrabold text-navy-900 text-xs">How to Get a Working Google App Password in 30 Seconds:</h4>
                <ol className="list-decimal list-inside space-y-1 font-medium">
                  <li>Go to your Google Account Settings at <strong>myaccount.google.com</strong>.</li>
                  <li>Click <strong>Security</strong> &rarr; Enable <strong>2-Step Verification</strong>.</li>
                  <li>Search for <strong>App Passwords</strong>.</li>
                  <li>Create an app named <code>HexaClinic</code> and copy the 16-character code (e.g., <code>abcd efgh ijkl mnop</code>).</li>
                  <li>Add <code>SMTP_PASS="abcd efgh ijkl mnop"</code> in your <code>.env.local</code> file!</li>
                </ol>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-950 space-y-1">
                <h4 className="font-extrabold text-emerald-900 text-xs">Alternative Cloud API (Resend.com)</h4>
                <p>
                  If you prefer API sending without Google SMTP blocks, get a free key from <strong>resend.com</strong> and set <code>RESEND_API_KEY=re_xxx</code> in <code>.env.local</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-teal-600" />
                Email Preview ({selectedPreview.patient_id} - {selectedPreview.patient_name})
              </h3>
              <button onClick={() => setSelectedPreview(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Clinic Sender</span>
                <strong className="text-teal-700">HexaClinic for Diabetes &lt;trashikabaskaran@gmail.com&gt;</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Recipient</span>
                <strong className="text-navy-900">{selectedPreview.patient_email} ({selectedPreview.patient_name})</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Subject</span>
                <strong className="text-navy-900">{selectedPreview.subject}</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap text-slate-800 text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                {selectedPreview.body}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const pId = selectedPreview.patient_id;
                  const email = selectedPreview.patient_email;
                  const name = selectedPreview.patient_name;
                  setSelectedPreview(null);
                  handleSendSingleEmail(pId, email, name);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-indigo-200" />
                <span>Send Email to This Patient Now</span>
              </button>
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
