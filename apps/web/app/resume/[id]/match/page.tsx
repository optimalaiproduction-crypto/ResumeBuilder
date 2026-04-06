"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, FileSearch, Sparkles, WandSparkles } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { ResumePreview } from "@/components/resume-preview";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { writeHasMatchInput } from "@/lib/match-state";
import type { AIProviderStatusResponse, RewriteBulletResponse, RewriteSummaryResponse, ScoreResponse } from "@/types/api";
import type { ResumeInput } from "@resumeforge/shared";
import { resumeSchema } from "@resumeforge/shared";

type BulletSelector = {
  workIndex: number;
  bulletIndex: number;
  value: string;
};

export default function MatchPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard title="Match Resume">
      <MatchContent resumeId={params.id} />
    </AuthGuard>
  );
}

function MatchContent({ resumeId }: { resumeId: string }) {
  const auth = useAuth();
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [summaryRewrite, setSummaryRewrite] = useState<RewriteSummaryResponse | null>(null);
  const [bulletRewrite, setBulletRewrite] = useState<RewriteBulletResponse | null>(null);
  const [selectedBullet, setSelectedBullet] = useState<BulletSelector | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [providerStatus, setProviderStatus] = useState<AIProviderStatusResponse | null>(null);

  useEffect(() => {
    async function load() {
      if (!auth.token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await api.getResume(resumeId, auth.token);
        setResume({ title: data.title, content: data.content });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load resume.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth.token, resumeId]);

  useEffect(() => {
    writeHasMatchInput(resumeId, Boolean(jobDescription.trim()));
  }, [jobDescription, resumeId]);

  useEffect(() => {
    async function loadProviderStatus() {
      if (!auth.token) {
        return;
      }
      try {
        const result = await api.providerStatus(auth.token);
        setProviderStatus(result);
      } catch {
        setProviderStatus(null);
      }
    }
    loadProviderStatus();
  }, [auth.token]);

  const providerLabel = useMemo(() => {
    if (!providerStatus) {
      return "AI Connected: Checking...";
    }
    const providers = providerStatus.providers;
    const chain = providerStatus.chain;
    for (const providerName of chain) {
      const found = providers.find((item) => item.provider === providerName);
      if (!found) {
        continue;
      }
      if (providerName === "fallback") {
        return "Fallback Mode";
      }
      if (found.healthy && found.available && found.configured) {
        return `AI Connected: ${providerName[0].toUpperCase()}${providerName.slice(1)}`;
      }
    }
    return "Fallback Mode";
  }, [providerStatus]);

  const providerTone: "neutral" | "warning" | "success" =
    providerLabel === "Fallback Mode" ? "warning" : providerLabel.includes("Checking") ? "neutral" : "success";
  const isFallbackMode = providerLabel === "Fallback Mode";

  const availableBullets = useMemo(() => {
    if (!resume) {
      return [];
    }
    const rows: BulletSelector[] = [];
    resume.content.workExperience.forEach((work, workIndex) => {
      work.bullets.forEach((bullet, bulletIndex) => {
        if (bullet.trim()) {
          rows.push({ workIndex, bulletIndex, value: bullet });
        }
      });
    });
    return rows;
  }, [resume]);

  async function extractKeywords() {
    if (!auth.token || !jobDescription.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.extractKeywords(jobDescription, auth.token);
      setKeywords(response.keywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract keywords.");
    } finally {
      setBusy(false);
    }
  }

  async function scoreResume() {
    if (!auth.token || !resume || !jobDescription.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.scoreResume(resume.content, jobDescription, auth.token, resumeId);
      setScore(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score resume.");
    } finally {
      setBusy(false);
    }
  }

  async function requestSummaryRewrite() {
    if (!auth.token || !resume || !jobDescription.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.rewriteSummary(resume.content, jobDescription, auth.token);
      setSummaryRewrite(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rewrite summary.");
    } finally {
      setBusy(false);
    }
  }

  async function requestBulletRewrite() {
    if (!auth.token || !selectedBullet || !jobDescription.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.rewriteBullet(
        selectedBullet.value,
        jobDescription,
        "Work experience bullet",
        auth.token
      );
      setBulletRewrite(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rewrite bullet.");
    } finally {
      setBusy(false);
    }
  }

  async function applySummaryRewrite() {
    if (!auth.token || !resume || !summaryRewrite) {
      return;
    }
    const updated = {
      ...resume,
      content: {
        ...resume.content,
        summary: summaryRewrite.rewrittenSummary
      }
    };
    const validation = resumeSchema.safeParse(updated);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid resume data.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.updateResume(resumeId, updated, auth.token);
      setResume(updated);
      setStatus("Summary rewrite applied.");
      setSummaryRewrite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply summary rewrite.");
    } finally {
      setBusy(false);
    }
  }

  async function applyBulletRewrite() {
    if (!auth.token || !resume || !bulletRewrite || !selectedBullet) {
      return;
    }
    const nextWork = resume.content.workExperience.map((work, workIndex) => {
      if (workIndex !== selectedBullet.workIndex) {
        return work;
      }
      return {
        ...work,
        bullets: work.bullets.map((bullet, bulletIndex) =>
          bulletIndex === selectedBullet.bulletIndex ? bulletRewrite.rewrittenBullet : bullet
        )
      };
    });

    const updated = {
      ...resume,
      content: { ...resume.content, workExperience: nextWork }
    };
    const validation = resumeSchema.safeParse(updated);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid resume data.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.updateResume(resumeId, updated, auth.token);
      setResume(updated);
      setStatus("Bullet rewrite applied.");
      setBulletRewrite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply bullet rewrite.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="card p-4 text-sm text-slate-600">Loading resume and matcher...</div>;
  }

  if (!resume) {
    return (
      <section className="space-y-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error || "Unable to load this resume for matching."}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
          <Link href="/resume/new" className="btn-primary">
            Create New Resume
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="page-title">Job Description Matcher</h1>
          <p className="page-subtitle">Extract ATS keywords, find gaps, and apply safe AI rewrites.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={providerLabel} tone={providerTone} />
          <StatusBadge
            label={score ? `${score.score}% Match Score` : "Awaiting score"}
            tone={score ? (score.score >= 80 ? "success" : score.score >= 60 ? "info" : "warning") : "neutral"}
          />
          <Link href={`/resume/${resumeId}/edit`} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Editor
          </Link>
          <Link href={`/resume/${resumeId}/preview`} className="btn-tertiary">
            <Eye className="h-4 w-4" aria-hidden />
            Preview & Export
          </Link>
        </div>
      </div>

      {status ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p> : null}
      {isFallbackMode ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          Fallback mode active. Suggestions are generated by built-in rules.
        </p>
      ) : null}
      {busy && providerLabel.includes("Ollama") ? (
        <p className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
          Ollama is running locally. AI actions can take 10-60 seconds depending on your system.
        </p>
      ) : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="card space-y-3 p-5">
            <label className="field-label">Target Job Description</label>
            <textarea
              className="textarea min-h-[220px]"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full job description..."
            />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={extractKeywords} disabled={busy || !jobDescription.trim()}>
                <FileSearch className="h-4 w-4" aria-hidden />
                Extract Keywords
              </button>
              <button className="btn-secondary" onClick={scoreResume} disabled={busy || !jobDescription.trim()}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Score Resume
              </button>
            </div>
          </div>

          {keywords.length ? (
            <div className="card p-5">
              <h2 className="text-base font-semibold">Extracted ATS Keywords</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {score ? (
            <div className="card space-y-3 p-5">
              <h2 className="text-base font-semibold">ATS Match Insights</h2>
              <p className="text-3xl font-bold text-brand-700">{score.score}%</p>
              <div>
                <p className="text-sm font-medium">Missing Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {score.missingKeywords.length ? (
                    score.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No major keyword gaps detected.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Suggestions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {score.suggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="card space-y-3 p-5">
            <h2 className="text-base font-semibold">AI Rewrite Actions</h2>
            <p className="text-sm text-slate-600">
              Rewrites preserve source truth. Review before applying.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={requestSummaryRewrite}
                disabled={busy || !jobDescription.trim()}
              >
                <WandSparkles className="h-4 w-4" aria-hidden />
                Rewrite Summary
              </button>
            </div>
            {summaryRewrite ? (
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium">Before</p>
                <p className="mt-1 text-slate-700">{summaryRewrite.originalSummary || "N/A"}</p>
                <p className="mt-3 font-medium">After</p>
                <p className="mt-1 text-slate-700">{summaryRewrite.rewrittenSummary}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary" onClick={applySummaryRewrite}>
                    Apply Summary
                  </button>
                  <button className="btn-secondary" onClick={() => setSummaryRewrite(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            <hr />

            <label className="field-label">Select a work bullet</label>
            <select
              className="input"
              value={selectedBullet ? `${selectedBullet.workIndex}-${selectedBullet.bulletIndex}` : ""}
              onChange={(e) => {
                const [workIndexRaw, bulletIndexRaw] = e.target.value.split("-");
                const workIndex = Number(workIndexRaw);
                const bulletIndex = Number(bulletIndexRaw);
                const match = availableBullets.find(
                  (item) => item.workIndex === workIndex && item.bulletIndex === bulletIndex
                );
                setSelectedBullet(match ?? null);
              }}
            >
              <option value="">Select bullet</option>
              {availableBullets.map((item) => (
                <option key={`${item.workIndex}-${item.bulletIndex}`} value={`${item.workIndex}-${item.bulletIndex}`}>
                  {item.value}
                </option>
              ))}
            </select>

            <button
              className="btn-primary"
              onClick={requestBulletRewrite}
              disabled={busy || !jobDescription.trim() || !selectedBullet}
            >
              <WandSparkles className="h-4 w-4" aria-hidden />
              Rewrite Selected Bullet
            </button>

            {bulletRewrite ? (
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium">Before</p>
                <p className="mt-1 text-slate-700">{bulletRewrite.originalBullet}</p>
                <p className="mt-3 font-medium">After</p>
                <p className="mt-1 text-slate-700">{bulletRewrite.rewrittenBullet}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary" onClick={applyBulletRewrite}>
                    Apply Bullet
                  </button>
                  <button className="btn-secondary" onClick={() => setBulletRewrite(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ResumePreview resume={resume} />
      </div>
    </section>
  );
}
