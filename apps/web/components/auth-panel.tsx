"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";

function firebaseErrorCode(err: unknown): string {
  if (typeof err === "object" && err && "code" in err) {
    return String((err as { code?: string }).code);
  }
  if (err instanceof Error) {
    const match = err.message.match(/auth\/[a-z-]+/);
    if (match?.[0]) {
      return match[0];
    }
  }
  return "";
}

function canFallbackToBackend(code: string): boolean {
  return (
    code === "auth/operation-not-allowed" ||
    code === "auth/configuration-not-found" ||
    code === "auth/invalid-api-key" ||
    code === "auth/app-not-authorized" ||
    code === "auth/network-request-failed" ||
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  );
}

export function AuthPanel() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextMode = searchParams.get("auth");
    if (nextMode === "login" || nextMode === "register") {
      setMode(nextMode);
      setShowPassword(false);
      setError("");
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalizedEmail = email.trim();
      const normalizedFullName = fullName.trim().replace(/\s+/g, " ");
      let response;
      if (mode === "register" && normalizedFullName.length < 2) {
        throw new Error("Please enter your full name.");
      }

      if (mode === "register") {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
        } catch (firebaseErr) {
          const code = firebaseErrorCode(firebaseErr);
          if (code !== "auth/email-already-in-use" && !canFallbackToBackend(code)) {
            throw firebaseErr;
          }
        }

        try {
          response = await api.register(normalizedFullName, normalizedEmail, password);
        } catch (backendErr) {
          const message = backendErr instanceof Error ? backendErr.message : "";
          if (!message.includes("409")) {
            throw backendErr;
          }
          response = await api.login(normalizedEmail, password);
        }
      } else {
        try {
          await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
        } catch (firebaseErr) {
          const code = firebaseErrorCode(firebaseErr);
          if (!canFallbackToBackend(code)) {
            throw firebaseErr;
          }
        }
        response = await api.login(normalizedEmail, password);
      }

      auth.setSession(
        response.access_token,
        response.user?.id ?? response.user_id,
        response.user?.email ?? response.email,
        response.user?.full_name ?? response.full_name ?? null
      );
      setFullName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch (err) {
      const code = firebaseErrorCode(err);
      const message = err instanceof Error ? err.message : "";
      if (code === "auth/operation-not-allowed") {
        setError("Sign in is temporarily unavailable. Please try again.");
      } else if (message.includes("auth/operation-not-allowed")) {
        setError("Sign in is temporarily unavailable. Please try again.");
      } else if (message.toLowerCase().includes("failed to fetch")) {
        setError("Unable to connect right now. Please try again.");
      } else {
        setError(message || "Authentication failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (auth.email) {
    return (
      <div id="auth-panel" className="card scroll-mt-28 p-6">
        <p className="text-sm text-slate-600">Logged in as</p>
        <p className="mt-1 text-base font-semibold text-slate-900">{auth.fullName || auth.email}</p>
        {auth.fullName ? <p className="text-sm text-slate-600">{auth.email}</p> : null}
      </div>
    );
  }

  return (
    <form id="auth-panel" onSubmit={handleSubmit} className="card scroll-mt-28 space-y-4 p-6 sm:p-7">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>
        <p className="text-sm text-slate-600">
          {mode === "login"
            ? "Access your dashboard, resumes, and ATS tools."
            : "Create an account to save and tailor resumes faster."}
        </p>
      </div>
      {mode === "register" ? (
        <div className="space-y-1.5">
          <label className="field-label">Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            minLength={2}
            autoComplete="name"
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="field-label mb-0">Password</label>
        <div className="relative">
          <input
            className="input pr-12"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
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
      {mode === "login" ? (
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline">
            Forgot Password?
          </Link>
        </div>
      ) : null}
      {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <button
        className="w-full text-sm text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline"
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setShowPassword(false);
          setError("");
        }}
      >
        {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
