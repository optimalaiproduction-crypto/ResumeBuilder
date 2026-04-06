"use client";

import { AuthPanel } from "@/components/auth-panel";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthGuard({
  children,
  title = "Sign in required",
  unauthenticatedContent
}: {
  children: React.ReactNode;
  title?: string;
  unauthenticatedContent?: React.ReactNode;
}) {
  const auth = useAuth();

  if (!auth.isReady) {
    return <div className="card p-4 text-sm text-slate-600">Checking your session...</div>;
  }

  if (!auth.token) {
    return (
      <section className="space-y-4">
        <h1 className="page-title text-3xl">{title}</h1>
        <p className="text-sm leading-6 text-slate-600">
          Please sign in to access resumes, AI optimization, and exports.
        </p>
        <AuthPanel />
        {unauthenticatedContent ? (
          <div className="space-y-4 pt-2">{unauthenticatedContent}</div>
        ) : null}
      </section>
    );
  }

  return <>{children}</>;
}
