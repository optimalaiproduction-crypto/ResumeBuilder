"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.forgotPassword(email.trim());
      setSuccess(response.message);
      if (response.dev_reset_token) {
        router.push(`/reset-password?token=${encodeURIComponent(response.dev_reset_token)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request password reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <div className="card p-6 sm:p-7">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
          Account Recovery
        </span>
        <h1 className="page-title mt-3 text-3xl">Forgot Password</h1>
        <p className="page-subtitle">
          Enter your account email. If it exists, you will receive a password reset link.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {success ? <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          {success ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Check your inbox and spam folder for the reset email.
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Remembered your password?{" "}
          <Link href="/" className="link-brand">
            Back to sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
