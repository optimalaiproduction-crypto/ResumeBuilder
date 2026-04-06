"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { api } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const hasToken = resetToken.length > 0;

  useEffect(() => {
    const incoming = tokenFromUrl.trim();
    if (!incoming) {
      return;
    }
    setResetToken((current) => current || incoming);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/reset-password");
    }
  }, [tokenFromUrl]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!hasToken) {
      setError("This reset link is invalid or expired. Request a new reset email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await api.resetPassword(resetToken, password, confirmPassword);
      setSuccess(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <div className="card p-6 sm:p-7">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
          Secure Reset
        </span>
        <h1 className="page-title mt-3 text-3xl">Reset Password</h1>
        <p className="page-subtitle">
          Set a new password for your ResumeForge account.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!hasToken ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This reset link is invalid. Please request a new password reset email.
            </p>
          ) : null}

          <div>
            <label className="field-label">New Password</label>
            <div className="relative">
              <input
                className="input pr-12"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-xl px-3 text-slate-500 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div>
            <label className="field-label">Confirm Password</label>
            <div className="relative">
              <input
                className="input pr-12"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-xl px-3 text-slate-500 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {success ? <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={busy || !hasToken}>
            {busy ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Back to login:{" "}
          <Link href="/" className="link-brand">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-xl"><div className="card p-6">Loading reset form...</div></section>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
