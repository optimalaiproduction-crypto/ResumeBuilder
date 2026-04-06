"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileArchive, FileType2, Sparkles } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { getCompletionPercent, getSectionHealthIssues } from "@/lib/resume-health";
import { templateCatalog, templates, type TemplateId } from "@/lib/templates";
import type { ResumeRecord, ResumeTemplateOption } from "@/types/api";

export default function PreviewPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard title="Preview & Export">
      <PreviewContent resumeId={params.id} />
    </AuthGuard>
  );
}

function isTemplateId(value: string): value is TemplateId {
  return value === "ats_classic" || value === "modern_sidebar" || value === "executive_clean";
}

function PreviewContent({ resumeId }: { resumeId: string }) {
  const auth = useAuth();
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<"server" | "client" | "docx" | null>(null);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("ats_classic");
  const [availableTemplates, setAvailableTemplates] = useState<ResumeTemplateOption[]>(templateCatalog);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    async function load() {
      if (!auth.token) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await api.getResume(resumeId, auth.token);
        setResume(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load resume.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth.token, resumeId]);

  useEffect(() => {
    let mounted = true;
    async function loadTemplates() {
      try {
        const response = await api.listTemplates();
        if (!mounted) {
          return;
        }
        const filtered = response.filter((item): item is ResumeTemplateOption => isTemplateId(item.id));
        if (filtered.length) {
          setAvailableTemplates(filtered);
          setSelectedTemplate((current) =>
            filtered.some((item) => item.id === current) ? current : (filtered[0].id as TemplateId)
          );
        }
      } catch {
        // Keep local fallback template catalog.
      }
    }
    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  async function downloadServer() {
    if (!auth.token || !resume) {
      return;
    }
    setBusyAction("server");
    setError("");
    try {
      const blob = await api.exportResume(
        "pdf",
        {
          resumeId: resume.id,
          templateId: selectedTemplate,
          method: "server",
          resumeData: {
            title: resume.title,
            content: resume.content
          }
        },
        auth.token
      );
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${resume.title}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      setToast({ message: "Server PDF downloaded.", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server PDF export failed.");
      setToast({ message: "Server PDF export failed.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadDocx() {
    if (!auth.token || !resume) {
      return;
    }
    setBusyAction("docx");
    setError("");
    try {
      const blob = await api.exportResume(
        "docx",
        {
          resumeId: resume.id,
          templateId: selectedTemplate,
          resumeData: {
            title: resume.title,
            content: resume.content
          }
        },
        auth.token
      );
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${resume.title}.docx`;
      a.click();
      URL.revokeObjectURL(href);
      setToast({ message: "DOCX downloaded.", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "DOCX export failed.");
      setToast({ message: "DOCX export failed.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadClient() {
    if (!resume) {
      return;
    }
    const element = document.getElementById("resume-preview");
    if (!element) {
      setError("Preview element not found.");
      return;
    }

    setBusyAction("client");
    setError("");
    try {
      const loadedModule = await import("html2pdf.js");
      const html2pdf = (loadedModule as { default?: any }).default ?? (loadedModule as any);
      await html2pdf()
        .set({
          margin: 10,
          filename: `${resume.title}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .from(element)
        .save();
      setToast({ message: "Client PDF downloaded.", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client PDF export failed.");
      setToast({ message: "Client PDF export failed.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  if (loading || !resume) {
    return <div className="card p-4 text-sm text-slate-600">Loading preview...</div>;
  }

  const templateData = { title: resume.title, content: resume.content };
  const Template = templates[selectedTemplate] ?? templates.ats_classic;
  const selectedTemplateMeta = availableTemplates.find((item) => item.id === selectedTemplate);
  const atsScore = getCompletionPercent(templateData);
  const atsIssues = getSectionHealthIssues(templateData);
  const isPerfectAts = atsScore === 100;
  const atsSuggestions =
    atsIssues.length > 0
      ? atsIssues
      : [
          "Expand summary with role-relevant keywords.",
          "Add measurable impact in experience bullets.",
          "Increase skills coverage for the target role."
        ];

  return (
    <section className="space-y-5">
      {toast ? <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}

      <div className="card relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700" aria-hidden />
        <div className="absolute -right-24 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -left-24 -bottom-20 h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" aria-hidden />

        <div className="relative flex flex-wrap items-start justify-between gap-5 px-6 py-6 text-white md:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
              Resume Studio
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Preview & Export</h1>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Review your final resume, track ATS readiness, and export in the format that works best for your application flow.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="ATS-safe output" tone="success" />
            <Link href={`/resume/${resumeId}/edit`} className="btn-secondary border-white/35 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Editor
            </Link>
            <Link
              href={`/resume/${resumeId}/match`}
              className="btn-tertiary border border-cyan-200/45 bg-cyan-300/10 !text-cyan-100 hover:bg-cyan-200/20 hover:!text-white"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Match & AI
            </Link>
          </div>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-3 p-4">
            <div>
              <h2 className="section-title text-lg">Template Selector</h2>
              <p className="text-sm text-slate-600">Pick the look for preview and export.</p>
            </div>
              <div className="space-y-2">
                {availableTemplates.map((template) => {
                  const active = selectedTemplate === template.id;
                  return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => isTemplateId(template.id) && setSelectedTemplate(template.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-brand-300 bg-brand-50 shadow-[0_0_0_1px_rgba(11,152,209,0.2)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            template.ats_friendly
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {template.ats_score}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {template.category} | {template.columns === 1 ? "Single column" : `${template.columns} columns`} |{" "}
                        {template.supports_photo ? "Photo supported" : "No photo"}
                      </p>
                    </button>
                  );
                })}
              </div>
              {selectedTemplateMeta ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Selected: <span className="font-semibold text-slate-800">{selectedTemplateMeta.name}</span> (
                  {selectedTemplateMeta.ats_friendly ? "ATS-friendly" : "Design-first"})
                </p>
              ) : null}
            </div>

          <div
            className={`card space-y-3 p-4 ${
              isPerfectAts ? "border-emerald-200 bg-emerald-50/45" : "border-amber-200 bg-amber-50/45"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title text-lg">ATS Score</h2>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                  isPerfectAts
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                    : "border-amber-300 bg-amber-100 text-amber-800"
                }`}
              >
                {atsScore}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="relative h-14 w-14 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(${isPerfectAts ? "#10b981" : "#f59e0b"} ${atsScore * 3.6}deg, rgba(148,163,184,0.25) 0deg)`
                }}
              >
                <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700">
                  {atsScore}
                </div>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${isPerfectAts ? "text-emerald-900" : "text-amber-900"}`}>
                  {isPerfectAts ? "Your resume is 100% ATS-friendly." : "Improve this resume to reach 100% ATS-friendly."}
                </p>
              </div>
            </div>

            {!isPerfectAts ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                {atsSuggestions.slice(0, 3).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="card space-y-3 p-4">
            <div>
              <h2 className="section-title text-lg">Downloads</h2>
              <p className="text-sm text-slate-600">Choose the format you need.</p>
            </div>
            <div className="space-y-2">
              <button className="btn-primary w-full justify-between" disabled={busyAction !== null} onClick={downloadServer}>
                <span className="inline-flex items-center gap-2">
                  <FileArchive className="h-4 w-4" aria-hidden />
                  {busyAction === "server" ? "Downloading..." : "Download PDF"}
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">Server</span>
              </button>

              <button
                className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 to-white px-4 py-2.5 text-sm font-semibold text-sky-800 shadow-[0_1px_0_rgba(2,132,199,0.15)] transition hover:from-sky-100 hover:to-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyAction !== null}
                onClick={downloadDocx}
              >
                <span className="inline-flex items-center gap-2">
                  <FileType2 className="h-4 w-4" aria-hidden />
                  {busyAction === "docx" ? "Downloading..." : "Download DOCX"}
                </span>
                <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">ATS</span>
              </button>

              <button className="btn-secondary w-full justify-between" disabled={busyAction !== null} onClick={downloadClient}>
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  {busyAction === "client" ? "Generating..." : "Lightweight PDF"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">Client</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Live Preview</p>
              <p className="text-sm text-slate-700">
                {selectedTemplateMeta?.name ?? "Selected template"} layout with your latest resume content.
              </p>
            </div>
            <StatusBadge label={isPerfectAts ? "Ready to Apply" : "Needs Improvement"} tone={isPerfectAts ? "success" : "warning"} />
          </div>

          <div className="card overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-500">
              Preview updates instantly based on template and resume data
            </div>
            <div className="p-4 sm:p-5">
              <div id="resume-preview">
                <Template data={templateData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
