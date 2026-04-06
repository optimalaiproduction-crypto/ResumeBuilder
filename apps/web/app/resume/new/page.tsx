"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { createStarterResume } from "@resumeforge/shared";

export default function NewResumePage() {
  return (
    <AuthGuard
      title="Create Resume"
      unauthenticatedContent={<LoggedOutTemplateGallery />}
    >
      <NewResumeContent />
    </AuthGuard>
  );
}

function LoggedOutTemplateGallery() {
  const templates = [
    {
      name: "Professional Classic",
      detail: "Balanced for corporate and cross-functional roles."
    },
    {
      name: "Technical Precision",
      detail: "Great for engineering, data, and product resumes."
    },
    {
      name: "Early Career Launch",
      detail: "Focused format for internships and first full-time roles."
    }
  ];

  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          Template Gallery
        </p>
        <h2 className="section-title text-2xl">Pick an ATS-safe starter after sign in.</h2>
        <p className="text-sm text-slate-600">
          Choose a clean structure first, then tailor each section to your target role.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.name}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{template.detail}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              ATS-safe
            </p>
          </article>
        ))}
      </div>

      <Link href="/?auth=login#auth-panel" className="btn-secondary w-fit">
        Sign in to unlock templates
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

function NewResumeContent() {
  const auth = useAuth();
  const router = useRouter();
  const hasStarted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function create() {
      if (!auth.token || hasStarted.current) {
        return;
      }
      hasStarted.current = true;
      setError("");
      try {
        const created = await api.createResume(createStarterResume(auth.email ?? undefined), auth.token);
        router.replace(`/resume/${created.id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create resume.");
        hasStarted.current = false;
      }
    }
    create();
  }, [auth.email, auth.token, router]);

  if (error) {
    return <div className="card p-4 text-sm text-rose-700">{error}</div>;
  }

  return <div className="card p-4 text-sm text-slate-600">Creating your new resume...</div>;
}
