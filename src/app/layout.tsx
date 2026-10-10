import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClinicalDisclaimer from "@/components/ClinicalDisclaimer";

export const metadata: Metadata = {
  title: "HexaClinic for Diabetes - Screening Prioritization Platform",
  description: "Research-backed screening follow-up prioritization web application for clinic triage and intake management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface-bg font-sans antialiased text-navy-900">
        <ClinicalDisclaimer />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              &copy; 2026 <strong>HexaClinic for Diabetes</strong>. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400">
              Not a clinical diagnostic tool. Intended for research screening prioritization & triage support.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
