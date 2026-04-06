"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Save, Sparkles } from "lucide-react";

import { ATSMatchPanel } from "@/components/ats-match-panel";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { ResumeEditor } from "@/components/resume-editor";
import { ResumePreview } from "@/components/resume-preview";
import { ProgressStepper, type ProgressStep } from "@/components/ui/progress-stepper";
import { SaveStatus } from "@/components/ui/save-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { StickyPreviewPanel } from "@/components/ui/sticky-preview-panel";
import { Toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { readHasMatchInput } from "@/lib/match-state";
import { getCompletionPercent, getEditorWorkflowSteps, getResumeStatus, getSectionHealthIssues } from "@/lib/resume-health";
import { emptyResume, resumeSchema, type ResumeInput } from "@resumeforge/shared";

type EditorSectionKey =
  | "basics"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications";

export default function EditResumePage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard title="Edit Resume">
      <EditResumeContent resumeId={params.id} />
    </AuthGuard>
  );
}

function EditResumeContent({ resumeId }: { resumeId: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [resume, setResume] = useState<ResumeInput>(emptyResume());
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" | "info" } | null>(null);
  const [activeScrollStepId, setActiveScrollStepId] = useState<string | null>(null);
  const [activeFocusedStepId, setActiveFocusedStepId] = useState<string | null>(null);
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionKey | null>(null);
  const [matchHasInput, setMatchHasInput] = useState(false);
  const lastSavedSnapshotRef = useRef("");
  const initializedRef = useRef(false);
  const sectionIds = useMemo(
    () => ({
      basics: "resume-basics",
      summary: "resume-summary",
      skills: "resume-skills",
      experience: "resume-experience",
      education: "resume-education",
      projects: "resume-projects",
      certifications: "resume-certifications"
    }),
    []
  );
  const sectionToStepMap = useMemo(() => {
    const entries: Array<[string, string]> = [];

    if (sectionIds.basics) entries.push([sectionIds.basics, "basics"]);
    if (sectionIds.summary) entries.push([sectionIds.summary, "basics"]);
    if (sectionIds.skills) entries.push([sectionIds.skills, "skills"]);
    if (sectionIds.experience) entries.push([sectionIds.experience, "experience"]);
    if (sectionIds.projects) entries.push([sectionIds.projects, "experience"]);
    if (sectionIds.education) entries.push([sectionIds.education, "education"]);
    if (sectionIds.certifications) entries.push([sectionIds.certifications, "education"]);

    return Object.fromEntries(entries) as Record<string, string>;
  }, [sectionIds]);
  const sectionToEditorMap = useMemo(() => {
    const entries: Array<[string, EditorSectionKey]> = [];

    if (sectionIds.basics) entries.push([sectionIds.basics, "basics"]);
    if (sectionIds.summary) entries.push([sectionIds.summary, "summary"]);
    if (sectionIds.skills) entries.push([sectionIds.skills, "skills"]);
    if (sectionIds.experience) entries.push([sectionIds.experience, "experience"]);
    if (sectionIds.projects) entries.push([sectionIds.projects, "projects"]);
    if (sectionIds.education) entries.push([sectionIds.education, "education"]);
    if (sectionIds.certifications) entries.push([sectionIds.certifications, "certifications"]);

    return Object.fromEntries(entries) as Record<string, EditorSectionKey>;
  }, [sectionIds]);

  useEffect(() => {
    async function load() {
      if (!auth.token) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await api.getResume(resumeId, auth.token);
        const loadedResume = { title: data.title, content: data.content };
        setResume(loadedResume);
        lastSavedSnapshotRef.current = JSON.stringify(loadedResume);
        setLastSavedAt(new Date(data.updated_at));
        initializedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load resume.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth.token, resumeId]);

  const validation = useMemo(() => resumeSchema.safeParse(resume), [resume]);
  const completion = useMemo(() => getCompletionPercent(resume), [resume]);
  const healthIssues = useMemo(() => getSectionHealthIssues(resume), [resume]);
  const workflowSteps = useMemo(
    () => getEditorWorkflowSteps(resume, resumeId, { matchCompleted: matchHasInput }),
    [matchHasInput, resume, resumeId]
  );
  const completionStatus = useMemo(() => getResumeStatus(completion), [completion]);
  const activeStepId = useMemo(() => {
    if (activeFocusedStepId) {
      return activeFocusedStepId;
    }
    if (activeScrollStepId) {
      return activeScrollStepId;
    }
    const firstIncomplete = workflowSteps.find((step) => !step.completed);
    return firstIncomplete?.id ?? "basics";
  }, [activeFocusedStepId, activeScrollStepId, workflowSteps]);
  const serializedResume = useMemo(() => JSON.stringify(resume), [resume]);

  useEffect(() => {
    const syncMatchState = () => {
      setMatchHasInput(readHasMatchInput(resumeId));
    };

    syncMatchState();
    window.addEventListener("focus", syncMatchState);
    window.addEventListener("storage", syncMatchState);

    return () => {
      window.removeEventListener("focus", syncMatchState);
      window.removeEventListener("storage", syncMatchState);
    };
  }, [resumeId]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const tracked = workflowSteps
      .filter(
        (step) =>
          step.targetId &&
          (step.id === "basics" ||
            step.id === "experience" ||
            step.id === "education" ||
            step.id === "skills")
      )
      .map((step) => {
        const element = document.getElementById(step.targetId as string);
        if (!element) {
          return null;
        }
        return { stepId: step.id, element };
      })
      .filter(Boolean) as Array<{ stepId: string; element: HTMLElement }>;

    if (!tracked.length) {
      return;
    }

    const updateActiveStep = () => {
      const viewportAnchor = 180;
      let currentStep = tracked[0].stepId;

      for (const item of tracked) {
        if (item.element.getBoundingClientRect().top <= viewportAnchor) {
          currentStep = item.stepId;
        } else {
          break;
        }
      }

      if (!activeFocusedStepId) {
        setActiveScrollStepId((prev) => (prev === currentStep ? prev : currentStep));
      }
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);

    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, [activeFocusedStepId, loading, workflowSteps]);

  const handleWorkflowStepSelect = useCallback(
    (step: ProgressStep) => {
      if ((step.id === "match" || step.id === "export") && step.href) {
        router.push(step.href);
        return;
      }

      if (step.targetId) {
        const target = document.getElementById(step.targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveScrollStepId(step.id);
          if (step.id === "basics" || step.id === "experience" || step.id === "education" || step.id === "skills") {
            setActiveFocusedStepId(step.id);
            setActiveEditorSection(step.id);
          } else {
            setActiveFocusedStepId(null);
          }
          return;
        }
      }

      if (step.href) {
        router.push(step.href);
      }
    },
    [router]
  );
  const handleEditorFocusCapture = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const parentSection = target.closest("section[id]");
      const parentId = parentSection?.id;

      if (!parentId) {
        return;
      }

      const mappedStepId = sectionToStepMap[parentId];
      const mappedEditorSection = sectionToEditorMap[parentId];
      if (!mappedStepId || !mappedEditorSection) {
        return;
      }

      setActiveScrollStepId((prev) => (prev === mappedStepId ? prev : mappedStepId));
      setActiveFocusedStepId((prev) => (prev === mappedStepId ? prev : mappedStepId));
      setActiveEditorSection((prev) => (prev === mappedEditorSection ? prev : mappedEditorSection));
    },
    [sectionToEditorMap, sectionToStepMap]
  );
  const handleEditorBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextFocused = event.relatedTarget as Node | null;
      if (nextFocused && event.currentTarget.contains(nextFocused)) {
        return;
      }
      setActiveFocusedStepId(null);
      setActiveEditorSection(null);
    },
    []
  );

  const persistResume = useCallback(async (mode: "manual" | "auto") => {
    if (!auth.token) {
      return;
    }
    if (!validation.success) {
      if (mode === "manual") {
        setError(validation.error.issues[0]?.message || "Validation failed.");
        setToast({ message: "Please fix validation issues before saving.", tone: "error" });
      }
      return;
    }

    setSaveState("saving");
    setError("");
    try {
      await api.updateResume(resumeId, resume, auth.token);
      lastSavedSnapshotRef.current = serializedResume;
      setLastSavedAt(new Date());
      setSaveState("saved");
      if (mode === "manual") {
        setToast({ message: "Resume saved successfully.", tone: "success" });
      }
    } catch (err) {
      setSaveState("error");
      setError(err instanceof Error ? err.message : "Failed to save.");
      if (mode === "manual") {
        setToast({ message: "Save failed. Please try again.", tone: "error" });
      }
    }
  }, [auth.token, resume, resumeId, serializedResume, validation]);

  useEffect(() => {
    if (!initializedRef.current || !auth.token || loading) {
      return;
    }
    if (serializedResume === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveState("idle");
    const timer = setTimeout(() => {
      void persistResume("auto");
    }, 1400);

    return () => clearTimeout(timer);
  }, [auth.token, loading, persistResume, serializedResume]);

  if (loading) {
    return <div className="card p-4 text-sm text-slate-600">Loading resume...</div>;
  }

  return (
    <section className="space-y-4">
      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      ) : null}

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Resume Editor</h1>
            <p className="page-subtitle">
              Fill core sections, improve ATS readiness, and keep the live preview visible while you edit.
            </p>
          </div>
          <div id="resume-export" className="flex flex-wrap items-center gap-2 scroll-mt-28">
            <StatusBadge label={`${completion}% complete`} tone={completionStatus.tone} />
            <Link className="btn-secondary" href={`/resume/${resumeId}/match`}>
              <Sparkles className="h-4 w-4" aria-hidden />
              Match & AI
            </Link>
            <Link className="btn-tertiary" href={`/resume/${resumeId}/preview`}>
              <Eye className="h-4 w-4" aria-hidden />
              Preview & Export
            </Link>
            <button className="btn-primary" onClick={() => void persistResume("manual")} disabled={saveState === "saving"}>
              <Save className="h-4 w-4" aria-hidden />
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <SaveStatus
            state={saveState}
            lastSavedAt={lastSavedAt}
            hasUnsavedChanges={serializedResume !== lastSavedSnapshotRef.current}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Section Health</p>
            {healthIssues.length ? (
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {healthIssues.slice(0, 3).map((issue) => (
                  <li key={issue} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-emerald-700">Strong baseline. Proceed to Match for keyword alignment.</p>
            )}
          </div>
        </div>
      </div>

      <ProgressStepper
        steps={workflowSteps}
        activeStepId={activeStepId}
        onStepSelect={handleWorkflowStepSelect}
      />

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(350px,0.9fr)]">
        <div onFocusCapture={handleEditorFocusCapture} onBlurCapture={handleEditorBlurCapture}>
          <ResumeEditor
            value={resume}
            onChange={setResume}
            sectionIds={sectionIds}
            activeSection={activeEditorSection}
          />
        </div>
        <StickyPreviewPanel
          title="Live Resume Preview"
          subtitle="Paper-style preview updates as you edit."
          footer={(
            <div
              id="resume-match"
              className={`scroll-mt-28 rounded-xl transition-all duration-200 ${
                activeStepId === "match"
                  ? "border border-brand-300 bg-brand-50/60 p-1.5 shadow-[0_0_0_2px_rgba(11,152,209,0.16)]"
                  : ""
              }`}
            >
              <ATSMatchPanel
                resumeId={resumeId}
                completion={completion}
                issues={healthIssues}
                active={activeStepId === "match"}
                matchReady={matchHasInput}
              />
            </div>
          )}
        >
          <ResumePreview resume={resume} activeSection={activeEditorSection} />
        </StickyPreviewPanel>
      </div>
    </section>
  );
}
