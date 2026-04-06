"use client";

import Link from "next/link";
import { FileText, LayoutDashboard, LogIn, Mail, ShieldCheck, Sparkles, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";

export function SiteFooter() {
  const auth = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-14 border-t border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200">
      <div className="site-shell grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-brand-200">
            <Sparkles className="h-4 w-4" aria-hidden />
            ResumeForge
          </Link>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            Build ATS-ready resumes with structured editing, smarter keyword matching, and recruiter-friendly exports.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Quick Links</h3>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/" className="text-slate-200 transition hover:text-white hover:underline">
              Home
            </Link>
            <Link href="/#template-gallery" className="text-slate-200 transition hover:text-white hover:underline">
              Templates
            </Link>
            <Link href="/faq" className="text-slate-200 transition hover:text-white hover:underline">
              FAQ
            </Link>
            <Link href="/contact" className="text-slate-200 transition hover:text-white hover:underline">
              Contact
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Legal</h3>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/privacy" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Privacy Policy
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
              <Mail className="h-4 w-4" aria-hidden />
              Contact Support
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Account</h3>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            {auth.email ? (
              <>
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </Link>
                <Link href="/resume/new" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
                  <FileText className="h-4 w-4" aria-hidden />
                  New Resume
                </Link>
              </>
            ) : (
              <>
                <Link href="/?auth=login#auth-panel" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
                  <LogIn className="h-4 w-4" aria-hidden />
                  Login
                </Link>
                <Link href="/?auth=register#auth-panel" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white hover:underline">
                  <UserPlus2 className="h-4 w-4" aria-hidden />
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="site-shell flex flex-col gap-2 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} ResumeForge. All rights reserved.</p>
          <p>Built for ATS-safe and recruiter-friendly resume workflows.</p>
        </div>
      </div>
    </footer>
  );
}
