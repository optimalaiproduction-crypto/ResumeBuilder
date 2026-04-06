"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, FilePlus2, LayoutDashboard, LogOut, Shield } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";

export function TopNav() {
  const auth = useAuth();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="site-shell flex items-center justify-between py-3.5">
        <Link href="/" className="rounded-lg px-1 text-lg font-semibold tracking-tight text-slate-900 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100">
          ResumeForge
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/dashboard" className="btn-secondary">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>
          <Link href="/resume/new" className="btn-secondary">
            <FilePlus2 className="h-4 w-4" aria-hidden />
            New Resume
          </Link>
          <Link href="/faq" className="btn-tertiary hidden md:inline-flex">
            <CircleHelp className="h-4 w-4" aria-hidden />
            FAQ
          </Link>
          <Link href="/privacy" className="btn-tertiary hidden md:inline-flex">
            <Shield className="h-4 w-4" aria-hidden />
            Privacy
          </Link>
          <Link href="/contact" className="btn-tertiary hidden lg:inline-flex">
            Contact
          </Link>
          {auth.email ? (
            <>
              <span className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 md:inline">
                {auth.fullName || auth.email}
              </span>
              <button onClick={auth.logout} className="btn-primary">
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            isHome ? (
              <Link href="/dashboard?auth=login" className="btn-secondary">
                Sign in
              </Link>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                Sign in to save
              </span>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
