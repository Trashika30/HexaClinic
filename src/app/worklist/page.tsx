"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListOrdered,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Stethoscope,
  Mail,
  Building2,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  PlusCircle,
  Phone,
  User,
  X,
  Send,
  HelpCircle,
  Check,
  Sparkles,
  Database,
  Pencil,
  Edit3,
} from "lucide-react";
import { ScoredPatientRecord } from "@/lib/types";

export default function CallbackWorklistPage() {
  const [records, setRecords] = useState<ScoredPatientRecord[]>([]);
  const [hospital, setHospital] = useState("HexaClinic for Diabetes");
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [qualityFilter, setQualityFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Toast Notification state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  // Add Patient Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patient_id: "",
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    pregnancies: "0",
    glucose: "120",
    blood_pressure: "80",
    skin_thickness: "20",
    insulin: "85",
    bmi: "28.5",
    pedigree: "0.45",
    age: "45",
  });

  // Edit/Update Patient Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editPatientSearchId, setEditPatientSearchId] = useState("");
  const [editPatient, setEditPatient] = useState({
    patient_id: "",
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    pregnancies: "0",
    glucose: "120",
    blood_pressure: "80",
    skin_thickness: "20",
    insulin: "85",
    bmi: "28.5",
    pedigree: "0.45",
    age: "45",
  });

  // Email Automation Guide Modal State
  const [isEmailGuideOpen, setIsEmailGuideOpen] = useState(false);

  const fetchWorklist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/score");
      const data = await res.json();
      if (data.top100) {
        setRecords(data.top100);
        if (data.hospital) setHospital(data.hospital);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Seed 1,000 DB Records
  const handleSeed1000 = async () => {
    if (!confirm("Are you sure you want to seed 1,000 dummy patient records into the database?")) return;
    setSeedLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRecords(data.top100);
        showToast("🌱 Database successfully seeded with 1,000 ML-scored dummy records!");
      } else {
        alert(`Failed to seed DB: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error seeding DB: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  // Mark Nurse Review Complete (Done)
  const handleMarkComplete = async (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation();
    setActionLoadingId(patientId);
    try {
      const res = await fetch("/api/nurse-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, action: "mark_complete" }),
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.top100);
        showToast(
          `✅ Patient ${patientId} marked as Reviewed / Done! Next prioritized patient automatically promoted into Top 100.`
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to complete nurse review: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Send Email to Individual Patient (trashikabaskaran@gmail.com)
  const handleSendSingleEmail = async (e: React.MouseEvent, rec: ScoredPatientRecord) => {
    e.stopPropagation();
    if (!rec.patient_email || !rec.patient_email.includes("@")) {
      alert(`Patient ${rec.patient_id} has no valid email address.`);
      return;
    }

    setEmailSendingId(rec.patient_id);
    try {
      const res = await fetch("/api/email/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: rec.patient_id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `📧 Email sent successfully to ${rec.patient_name} (${rec.patient_email}) from trashikabaskaran@gmail.com!`
        );
        // Local update email state
        setRecords((prev) =>
          prev.map((r) =>
            r.patient_id === rec.patient_id ? { ...r, email_send_status: "delivered" } : r
          )
        );
      } else {
        alert(`Email dispatch error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to send email: ${err.message}`);
    } finally {
      setEmailSendingId(null);
    }
  };

  // Open Edit Modal for a specific patient
  const handleOpenEditModal = (e: React.MouseEvent | null, rec: ScoredPatientRecord) => {
    if (e) e.stopPropagation();
    setEditPatient({
      patient_id: rec.patient_id,
      patient_name: rec.patient_name,
      patient_phone: rec.patient_phone || "",
      patient_email: rec.patient_email || "",
      pregnancies: String(rec.clinical_features.pregnancies),
      glucose: String(rec.clinical_features.glucose),
      blood_pressure: String(rec.clinical_features.blood_pressure),
      skin_thickness: String(rec.clinical_features.skin_thickness),
      insulin: String(rec.clinical_features.insulin),
      bmi: String(rec.clinical_features.bmi),
      pedigree: String(rec.clinical_features.pedigree),
      age: String(rec.clinical_features.age),
    });
    setEditPatientSearchId(rec.patient_id);
    setIsEditModalOpen(true);
  };

  // Search Patient by ID for editing
  const handleSearchPatientByIdForEdit = async (patientIdToFind: string) => {
    if (!patientIdToFind.trim()) return;
    try {
      const res = await fetch(`/api/patient/update?patient_id=${encodeURIComponent(patientIdToFind.trim())}`);
      const data = await res.json();
      if (data.success && data.patient) {
        const p = data.patient;
        setEditPatient({
          patient_id: p.patient_id,
          patient_name: p.patient_name,
          patient_phone: p.patient_phone || "",
          patient_email: p.patient_email || "",
          pregnancies: String(p.clinical_features.pregnancies),
          glucose: String(p.clinical_features.glucose),
          blood_pressure: String(p.clinical_features.blood_pressure),
          skin_thickness: String(p.clinical_features.skin_thickness),
          insulin: String(p.clinical_features.insulin),
          bmi: String(p.clinical_features.bmi),
          pedigree: String(p.clinical_features.pedigree),
          age: String(p.clinical_features.age),
        });
        showToast(`Loaded details for Patient ID: ${p.patient_id}`, "info");
      } else {
        alert(`Patient ID '${patientIdToFind}' not found in database.`);
      }
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    }
  };

  // Submit Patient Record Update
  const handleUpdatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormLoading(true);
    try {
      const res = await fetch("/api/patient/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPatient),
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.top100);
        setIsEditModalOpen(false);
        showToast(
          `✨ Patient ${editPatient.patient_id} updated! Glucose set to ${editPatient.glucose} mg/dL. New Risk Score: ${(data.patient.model_score * 100).toFixed(1)}% (Rank #${data.patient.rank}).`
        );
      } else {
        alert(`Failed to update patient: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error updating patient: ${err.message}`);
    } finally {
      setEditFormLoading(false);
    }
  };

  // Add Patient directly to DB
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.patient_id.trim()) {
      alert("Please enter a valid Patient ID.");
      return;
    }
    setAddFormLoading(true);
    try {
      const res = await fetch("/api/patient/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.top100);
        setIsAddModalOpen(false);
        showToast(
          `🎉 Patient ${newPatient.patient_id} (${newPatient.patient_name || "New Patient"}) saved & ML-scored!`
        );
        // Reset form
        setNewPatient({
          patient_id: "",
          patient_name: "",
          patient_phone: "",
          patient_email: "",
          pregnancies: "0",
          glucose: "120",
          blood_pressure: "80",
          skin_thickness: "20",
          insulin: "85",
          bmi: "28.5",
          pedigree: "0.45",
          age: "45",
        });
      } else {
        alert(`Failed to add patient: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error adding patient: ${err.message}`);
    } finally {
      setAddFormLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredRecords = records.filter((rec) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      rec.patient_id.toLowerCase().includes(searchLower) ||
      (rec.patient_name && rec.patient_name.toLowerCase().includes(searchLower)) ||
      (rec.patient_phone && rec.patient_phone.toLowerCase().includes(searchLower)) ||
      rec.patient_email.toLowerCase().includes(searchLower);

    const matchesTier = tierFilter === "ALL" || rec.priority_tier === tierFilter;

    const matchesQuality =
      qualityFilter === "ALL" ||
      (qualityFilter === "RELIABLE" && rec.quality.is_reliable) ||
      (qualityFilter === "IMPUTED" && !rec.quality.is_reliable);

    return matchesSearch && matchesTier && matchesQuality;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in text-xs font-bold border border-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-100 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 text-xs font-extrabold rounded-lg border border-teal-200 mb-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Clinic: {hospital}</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2.5 tracking-tight">
            <ListOrdered className="w-6 h-6 text-teal-600" />
            Prioritized Callback Worklist (Top 100 Queue)
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Deterministic rank based on Random Forest risk model (Score DESC &rarr; Age DESC &rarr; PatientID ASC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seed 1,000 Records Button */}
          <button
            onClick={handleSeed1000}
            disabled={seedLoading}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            title="Populate persistent DB with 1,000 ML-scored dummy patients"
          >
            {seedLoading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> : <Database className="w-4 h-4 text-emerald-600" />}
            <span>Seed 1,000 Records</span>
          </button>

          {/* Update Patient by ID Button */}
          <button
            onClick={() => {
              setEditPatientSearchId("");
              setIsEditModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Pencil className="w-4 h-4 text-amber-100" />
            <span>Update Patient by ID</span>
          </button>

          {/* Add Patient Directly to DB Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-teal-100" />
            <span>Add Patient to DB</span>
          </button>

          {/* Email Automation Info Button */}
          <button
            onClick={() => setIsEmailGuideOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Email Config</span>
          </button>

          {/* Export Worklist Button */}
          <a
            href="/api/export"
            download
            className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-teal-300" />
            <span>Export (.xlsx)</span>
          </a>

          <button
            onClick={fetchWorklist}
            className="p-2 text-slate-500 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh worklist"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Patient Name, Phone, ID, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-navy-900 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Priority Tier Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Priority Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 text-navy-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Tiers ({records.length})</option>
              <option value="High Priority">High Priority (&ge;0.65)</option>
              <option value="Moderate Priority">Moderate Priority (0.40-0.64)</option>
              <option value="Standard Follow-Up">Standard Follow-Up (&lt;0.40)</option>
            </select>
          </div>

          {/* Data Quality Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700">Data Quality:</span>
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 text-navy-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Quality States</option>
              <option value="RELIABLE">Fully Recorded Data</option>
              <option value="IMPUTED">Contains Imputed Zeros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prioritized Records Table */}
      {records.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredRecords.length}</strong> active pending patients in Top 100 queue
            </span>
            <span className="font-mono text-[11px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
              When nurse clicks "Mark Done", patient exits Top 100 & rank #101 automatically enters queue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-navy-900 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3 text-center">Rank</th>
                  <th className="py-3.5 px-3">Patient ID</th>
                  <th className="py-3.5 px-3">Patient Name</th>
                  <th className="py-3.5 px-3">Phone Number</th>
                  <th className="py-3.5 px-3">Priority Tier</th>
                  <th className="py-3.5 px-3 text-center">Risk Score</th>
                  <th className="py-3.5 px-3">Age</th>
                  <th className="py-3.5 px-3">Glucose</th>
                  <th className="py-3.5 px-3 text-center">Interactive Actions</th>
                  <th className="py-3.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((rec) => {
                  const isExpanded = expandedId === rec.patient_id;
                  const isLoadingAction = actionLoadingId === rec.patient_id;
                  const isSendingEmail = emailSendingId === rec.patient_id;

                  const tierClass =
                    rec.priority_tier === "High Priority"
                      ? "clinical-badge-high"
                      : rec.priority_tier === "Moderate Priority"
                      ? "clinical-badge-moderate"
                      : "clinical-badge-standard";

                  return (
                    <React.Fragment key={rec.patient_id}>
                      <tr
                        onClick={() => toggleExpand(rec.patient_id)}
                        className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                          isExpanded ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono font-black text-navy-900 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                            #{rec.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-extrabold text-navy-900">
                          {rec.patient_id}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-navy-900">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{rec.patient_name || `Patient ${rec.patient_id}`}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700">
                          <div className="flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md w-fit font-bold">
                            <Phone className="w-3 h-3 text-teal-600" />
                            <span>{rec.patient_phone || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${tierClass}`}>
                            {rec.priority_tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-teal-700 text-xs">
                          {(rec.model_score * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-3 font-bold">{rec.clinical_features.age} yrs</td>
                        <td className="py-3.5 px-3 font-mono font-bold">
                          {rec.clinical_features.glucose === 0 ? (
                            <span className="text-amber-700 font-extrabold" title="Imputed">Imputed 0</span>
                          ) : (
                            `${rec.clinical_features.glucose} mg/dL`
                          )}
                        </td>

                        {/* Attractive Interactive Action Buttons */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Send Individual Patient Email Button */}
                            <button
                              onClick={(e) => handleSendSingleEmail(e, rec)}
                              disabled={isSendingEmail}
                              className={`px-2.5 py-1.5 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1 ${
                                rec.email_send_status === "delivered"
                                  ? "bg-slate-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                              }`}
                              title={`Send follow-up email directly to ${rec.patient_name} (${rec.patient_email}) from trashikabaskaran@gmail.com`}
                            >
                              {isSendingEmail ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-indigo-200" />
                              )}
                              <span>{rec.email_send_status === "delivered" ? "Sent" : "Send Email"}</span>
                            </button>

                            {/* Edit Patient Record Button */}
                            <button
                              onClick={(e) => handleOpenEditModal(e, rec)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1"
                              title="Edit glucose level, BMI, BP, or contact info for this patient"
                            >
                              <Pencil className="w-3 h-3 text-amber-100" />
                              <span>Edit</span>
                            </button>

                            {/* Mark Review Complete Button */}
                            <button
                              onClick={(e) => handleMarkComplete(e, rec.patient_id)}
                              disabled={isLoadingAction}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1 disabled:opacity-50"
                              title="Click when nurse finishes reviewing patient. Removes from Top 100 & pulls next patient into queue."
                            >
                              {isLoadingAction ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                              )}
                              <span>Mark Done</span>
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button className="text-slate-400 hover:text-navy-900 p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Record Detail View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="bg-slate-50/90 p-5 border-y border-slate-200">
                            <div className="space-y-4 max-w-5xl mx-auto">
                              {/* Clinical & Contact Detail Summary */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Phone</span>
                                  <strong className="text-xs text-navy-900 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-teal-600" />
                                    {rec.patient_phone || "N/A"}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Email</span>
                                  <strong className="text-xs text-navy-900 font-mono truncate block mt-0.5">
                                    {rec.patient_email || "No Email Provided"}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Glucose Level</span>
                                  <strong className="text-xs text-navy-900 font-mono block mt-0.5">{rec.clinical_features.glucose} mg/dL</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">BMI</span>
                                  <strong className="text-xs text-navy-900 font-mono block mt-0.5">{rec.clinical_features.bmi}</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Diastolic BP</span>
                                  <strong className="text-xs text-navy-900 font-mono block mt-0.5">{rec.clinical_features.blood_pressure} mm Hg</strong>
                                </div>
                              </div>

                              {/* Action Strip */}
                              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                                <div className="text-xs font-bold text-navy-900">
                                  Quick Actions for {rec.patient_name} ({rec.patient_id}):
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleSendSingleEmail(e, rec)}
                                    disabled={isSendingEmail}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                                  >
                                    <Mail className="w-4 h-4 text-indigo-200" />
                                    <span>Send Individual Email</span>
                                  </button>

                                  <button
                                    onClick={(e) => handleOpenEditModal(e, rec)}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                                  >
                                    <Pencil className="w-4 h-4 text-amber-100" />
                                    <span>Edit Record & Glucose</span>
                                  </button>

                                  <button
                                    onClick={(e) => handleMarkComplete(e, rec.patient_id)}
                                    disabled={isLoadingAction}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                    <span>Mark Review Done</span>
                                  </button>
                                </div>
                              </div>

                              {/* Nurse Discussion Prompt Box */}
                              <div className="bg-teal-50/90 border border-teal-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-extrabold text-teal-900">
                                    <Stethoscope className="w-4 h-4 text-teal-700" />
                                    <span>Nurse Discussion Prompt (Non-Diagnostic Intake Direction)</span>
                                  </div>
                                </div>
                                <p className="text-xs text-teal-950 font-medium leading-relaxed bg-white/90 p-3.5 rounded-lg border border-teal-100">
                                  {rec.nurse_prompt}
                                </p>
                              </div>

                              {/* Patient-Facing Email Preview */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 font-bold text-navy-900">
                                    <Mail className="w-4 h-4 text-teal-600" />
                                    <span>Patient-Facing Email Content</span>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    To: {rec.patient_email} ({rec.patient_name})
                                  </span>
                                </div>
                                <div className="text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap text-slate-800">
                                  <strong>Subject:</strong> {rec.patient_email_subject}
                                  {"\n\n"}
                                  {rec.patient_email_body}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Update Patient Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">Update Patient Record by Patient ID</h3>
                  <p className="text-xs text-slate-500">
                    Modify glucose level, BMI, or contact details & recalculate Random Forest ML risk score.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-navy-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search Patient ID bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 whitespace-nowrap">Load Patient ID:</span>
              <input
                type="text"
                placeholder="Enter Patient ID (e.g. PAT-1001)..."
                value={editPatientSearchId}
                onChange={(e) => setEditPatientSearchId(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-600 text-navy-900"
              />
              <button
                type="button"
                onClick={() => handleSearchPatientByIdForEdit(editPatientSearchId)}
                className="px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-lg transition-colors"
              >
                Search & Load
              </button>
            </div>

            <form onSubmit={handleUpdatePatientSubmit} className="space-y-4 text-xs">
              {/* Demographics */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-navy-900 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Patient Demographics & Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient ID *</label>
                    <input
                      type="text"
                      required
                      value={editPatient.patient_id}
                      onChange={(e) => setEditPatient({ ...editPatient, patient_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-100 text-navy-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      value={editPatient.patient_name}
                      onChange={(e) => setEditPatient({ ...editPatient, patient_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPatient.patient_phone}
                      onChange={(e) => setEditPatient({ ...editPatient, patient_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editPatient.patient_email}
                      onChange={(e) => setEditPatient({ ...editPatient, patient_email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-navy-900"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Predictors to Edit */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
                <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-amber-600" />
                  <span>Clinical Predictors (Update Glucose & Lab Values)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-300 shadow-2xs">
                    <label className="block font-black text-amber-950 mb-1">Glucose (mg/dL) *</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={editPatient.glucose}
                      onChange={(e) => setEditPatient({ ...editPatient, glucose: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-amber-400 rounded-lg text-xs font-mono font-bold text-navy-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">BMI (kg/m&sup2;)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="80"
                      value={editPatient.bmi}
                      onChange={(e) => setEditPatient({ ...editPatient, bmi: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age (yrs)</label>
                    <input
                      type="number"
                      min="18"
                      max="110"
                      value={editPatient.age}
                      onChange={(e) => setEditPatient({ ...editPatient, age: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diastolic BP</label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={editPatient.blood_pressure}
                      onChange={(e) => setEditPatient({ ...editPatient, blood_pressure: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Insulin (&mu;U/mL)</label>
                    <input
                      type="number"
                      min="0"
                      max="900"
                      value={editPatient.insulin}
                      onChange={(e) => setEditPatient({ ...editPatient, insulin: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pregnancies</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editPatient.pregnancies}
                      onChange={(e) => setEditPatient({ ...editPatient, pregnancies: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Skin Thickness</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editPatient.skin_thickness}
                      onChange={(e) => setEditPatient({ ...editPatient, skin_thickness: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pedigree Func</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="3"
                      value={editPatient.pedigree}
                      onChange={(e) => setEditPatient({ ...editPatient, pedigree: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {editFormLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-200" />
                  )}
                  <span>Save Record & Recalculate ML Risk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patient Directly to DB Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">Add Patient Directly to Database</h3>
                  <p className="text-xs text-slate-500">
                    Saves directly to persistent database & executes real ML risk scoring on the fly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-navy-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-navy-900 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Patient Demographics & Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PAT-201"
                      value={newPatient.patient_id}
                      onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maria Rodriguez"
                      value={newPatient.patient_name}
                      onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1-555-0148"
                      value={newPatient.patient_phone}
                      onChange={(e) => setNewPatient({ ...newPatient, patient_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. m.rodriguez@example.com"
                      value={newPatient.patient_email}
                      onChange={(e) => setNewPatient({ ...newPatient, patient_email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-navy-900 text-xs flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>Clinical Risk Predictors</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Glucose (mg/dL)</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={newPatient.glucose}
                      onChange={(e) => setNewPatient({ ...newPatient, glucose: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">BMI (kg/m&sup2;)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="80"
                      value={newPatient.bmi}
                      onChange={(e) => setNewPatient({ ...newPatient, bmi: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age (yrs)</label>
                    <input
                      type="number"
                      min="18"
                      max="110"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diastolic BP</label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={newPatient.blood_pressure}
                      onChange={(e) => setNewPatient({ ...newPatient, blood_pressure: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFormLoading}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {addFormLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-teal-200" />
                  )}
                  <span>Save to DB & Prioritize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Automation Config Modal */}
      {isEmailGuideOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">Email Automation Configured</h3>
                  <p className="text-xs text-slate-500">
                    Automated email dispatch is configured for <strong>trashikabaskaran@gmail.com</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailGuideOpen(false)}
                className="text-slate-400 hover:text-navy-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl text-indigo-950 space-y-2">
                <h4 className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Active Email Credentials Configured</span>
                </h4>
                <div className="bg-navy-900 text-teal-300 p-3 rounded-lg font-mono text-[11px] space-y-1">
                  <div>Sender Account: trashikabaskaran@gmail.com</div>
                  <div>SMTP Host: smtp.gmail.com (Port 465 SSL)</div>
                  <div>Display Name: HexaClinic for Diabetes</div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-950 space-y-1">
                <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Features Available</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-emerald-900">
                  <li><strong>Send to Particular Patient:</strong> Click <code>Send Email</code> on any row or patient detail card.</li>
                  <li><strong>Batch Review & Dispatch:</strong> Review and send all queued follow-up emails on the Email Dispatch page.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEmailGuideOpen(false)}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-xs"
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
