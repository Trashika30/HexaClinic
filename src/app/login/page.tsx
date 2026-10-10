"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, User, KeyRound, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("trashika");
  const [password, setPassword] = useState("trash#123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = () => {
    setUsername("trashika");
    setPassword("trash#123");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-900 to-teal-600 text-white shadow-lg shadow-navy-950/10 mb-4">
            <Activity className="w-8 h-8 text-teal-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">
            Hexa<span className="text-teal-600">Clinic</span> for Diabetes Staff Access
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Clinical Triage & Follow-up Prioritization Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-navy-900 font-medium"
                  placeholder="Enter staff username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-navy-900 font-medium"
                  placeholder="Enter security password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Encrypted Session
              </span>
              <button
                type="button"
                onClick={autofillDemo}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Autofill Credentials
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Prioritization Portal</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1">
                Configured Staff Credentials
              </span>
              <div className="text-xs font-mono text-navy-900 flex justify-between items-center">
                <span>Username: <strong className="text-teal-700">trashika</strong></span>
                <span>Password: <strong className="text-teal-700">trash#123</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
