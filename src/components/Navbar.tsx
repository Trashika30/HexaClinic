"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  UploadCloud,
  ListOrdered,
  ShieldAlert,
  BarChart3,
  MailCheck,
  Settings,
  Building2,
  UserCheck,
  LogOut,
  LogIn,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hospital, setHospital] = useState("HexaClinic");
  const [isTestMode, setIsTestMode] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.session);
          if (data.session.hospital) setHospital(data.session.hospital);
        }
      })
      .catch(() => {});

    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.currentHospital) setHospital(data.settings.currentHospital);
          setIsTestMode(data.settings.isTestMode);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setCurrentUser(null);
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Excel Upload", href: "/upload", icon: UploadCloud },
    { name: "Callback Worklist", href: "/worklist", icon: ListOrdered },
    { name: "Data Quality", href: "/data-quality", icon: ShieldAlert },
    { name: "Model Performance", href: "/model-performance", icon: BarChart3 },
    { name: "Email Review", href: "/email-review", icon: MailCheck },
    { name: "Audit & Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-navy-900">
                  Hexa<span className="text-teal-600">Clinic</span> <span className="text-xs font-semibold text-slate-500 block sm:inline">for Diabetes</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Clinical Prioritization
                </span>
              </div>
            </Link>

            {/* Hospital Identification Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-semibold text-navy-900">{hospital}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Clinic Session" />
            </div>
          </div>

          {/* Right Session / Auth Controls */}
          <div className="flex items-center gap-3">
            {/* Mode indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isTestMode 
                ? "bg-amber-50 text-amber-800 border-amber-200" 
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}>
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{isTestMode ? "Preview Mode" : "Live Provider"}</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-navy-900 flex items-center gap-1 justify-end">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    @{currentUser.username} • {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-navy-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-300" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
