"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Copy, Eye, FilePlus2, ScanSearch, ShieldCheck, Sparkles, Trash2, WandSparkles } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ResumeTemplateCard } from "@/components/ui/resume-template-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { getCompletionPercent, getResumeStatus } from "@/lib/resume-health";
import type { ResumeRecord } from "@/types/api";
import { createId, createStarterResume, type ResumeInput } from "@resumeforge/shared";

type TemplateOption = {
  id: string;
  icon: string;
  name: string;
  fit: string;
  highlights: string[];
  build: (email?: string) => ResumeInput;
};

function isInvalidTokenError(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    message.includes("invalid authentication token") ||
    message.includes("not authenticated") ||
    message.includes("could not validate credentials") ||
    message.includes("token has expired")
  );
}

function withStarterBasics(
  email: string | undefined,
  title: string,
  summary: string,
  skills: string[],
  workExperience: ResumeInput["content"]["workExperience"],
  education: ResumeInput["content"]["education"],
  projects: ResumeInput["content"]["projects"],
  certifications: ResumeInput["content"]["certifications"] = []
): ResumeInput {
  const starter = createStarterResume(email);
  return {
    ...starter,
    title,
    content: {
      ...starter.content,
      summary,
      skills,
      workExperience,
      education,
      projects,
      certifications
    }
  };
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "software-engineer",
    icon: "SE",
    name: "Software Engineer ATS",
    fit: "Backend, full-stack, and platform roles.",
    highlights: ["Python/FastAPI keywords", "Impact-focused bullets", "Project-ready structure"],
    build: (email?: string) =>
      withStarterBasics(
        email,
        "Software Engineer Resume",
        "Results-focused software engineer building scalable APIs and reliable user-facing systems. Translates product requirements into maintainable, high-performance releases.",
        ["Python", "FastAPI", "TypeScript", "PostgreSQL", "Docker", "REST APIs", "CI/CD"],
        [
          {
            id: createId(),
            company: "NovaTech Solutions",
            title: "Software Engineer",
            startDate: "2022",
            endDate: "",
            current: true,
            bullets: [
              "Built and maintained FastAPI services supporting core product workflows and reduced API response latency by 28%.",
              "Partnered with product and QA to ship 20+ production features with automated regression coverage.",
              "Improved observability using structured logging and alerting, reducing incident triage time by 35%."
            ]
          }
        ],
        [
          {
            id: createId(),
            institution: "State University",
            degree: "B.Tech in Computer Science",
            startDate: "2018",
            endDate: "2022"
          }
        ],
        [
          {
            id: createId(),
            name: "Resume Keyword Optimizer",
            description:
              "Developed a resume analysis tool that extracts ATS terms and highlights missing job-description keywords.",
            link: "",
            technologies: ["Python", "NLP", "FastAPI"],
            bullets: [
              "Implemented keyword extraction and scoring logic used to improve role-match alignment.",
              "Designed clean JSON output for integration with frontend dashboards."
            ]
          }
        ]
      )
  },
  {
    id: "data-analyst",
    icon: "DA",
    name: "Data Analyst ATS",
    fit: "Analytics, BI, and reporting roles.",
    highlights: ["SQL-heavy profile", "Business impact language", "Metrics-first bullets"],
    build: (email?: string) =>
      withStarterBasics(
        email,
        "Data Analyst Resume",
        "Data analyst experienced in turning complex datasets into clear business insights. Builds reliable dashboards, automates recurring reporting, and improves decision-making speed.",
        ["SQL", "Python", "Excel", "Power BI", "Tableau", "Data Cleaning", "A/B Testing"],
        [
          {
            id: createId(),
            company: "Insight Retail Group",
            title: "Data Analyst",
            startDate: "2021",
            endDate: "",
            current: true,
            bullets: [
              "Automated weekly KPI reporting pipelines, reducing manual reporting effort by 10 hours per week.",
              "Built executive dashboards tracking sales, conversion, and retention across 5 product lines.",
              "Performed cohort and funnel analysis to identify drop-off points and support targeted optimization."
            ]
          }
        ],
        [
          {
            id: createId(),
            institution: "Metro University",
            degree: "B.Sc in Statistics",
            startDate: "2017",
            endDate: "2021"
          }
        ],
        [
          {
            id: createId(),
            name: "Customer Retention Analysis",
            description:
              "Analyzed customer lifecycle behavior and created segmentation insights for marketing and product teams.",
            link: "",
            technologies: ["SQL", "Python", "Power BI"],
            bullets: [
              "Identified top churn drivers and recommended interventions for high-risk user segments.",
              "Delivered dashboard views used by leadership during quarterly planning."
            ]
          }
        ]
      )
  },
  {
    id: "product-manager",
    icon: "PM",
    name: "Product Manager ATS",
    fit: "Product, growth, and strategy roles.",
    highlights: ["Cross-functional impact", "Roadmap ownership", "Customer-centric keywords"],
    build: (email?: string) =>
      withStarterBasics(
        email,
        "Product Manager Resume",
        "Product manager with experience defining roadmap priorities, aligning cross-functional teams, and shipping customer-centered features that improve activation and retention.",
        ["Product Strategy", "Roadmapping", "Stakeholder Management", "User Research", "Experimentation", "Agile"],
        [
          {
            id: createId(),
            company: "Orbit SaaS",
            title: "Product Manager",
            startDate: "2020",
            endDate: "",
            current: true,
            bullets: [
              "Owned roadmap for onboarding and activation surfaces, increasing new-user activation by 17%.",
              "Led discovery with design and engineering using interviews and usage data to define quarterly priorities.",
              "Coordinated feature launches with go-to-market teams and tracked post-launch adoption metrics."
            ]
          }
        ],
        [
          {
            id: createId(),
            institution: "City Business School",
            degree: "MBA",
            startDate: "2018",
            endDate: "2020"
          }
        ],
        [
          {
            id: createId(),
            name: "Self-Serve Trial Redesign",
            description:
              "Redesigned trial onboarding flow to reduce time-to-value and improve conversion into paid plans.",
            link: "",
            technologies: ["Product Analytics", "Figma", "A/B Testing"],
            bullets: [
              "Prioritized top friction points through event analysis and session review.",
              "Shipped iterative improvements that improved trial-to-paid conversion."
            ]
          }
        ]
      )
  },
  {
    id: "operations-manager",
    icon: "OP",
    name: "Operations Manager ATS",
    fit: "Operations, program, and process roles.",
    highlights: ["Process optimization", "Execution rigor", "SOP and KPI alignment"],
    build: (email?: string) =>
      withStarterBasics(
        email,
        "Operations Manager Resume",
        "Operations manager focused on process efficiency, service quality, and cross-team execution. Improves workflows through KPI-driven planning and standardized operating procedures.",
        ["Process Improvement", "KPI Tracking", "SOP Development", "Vendor Management", "Cross-functional Leadership"],
        [
          {
            id: createId(),
            company: "Prime Logistics Co.",
            title: "Operations Manager",
            startDate: "2019",
            endDate: "",
            current: true,
            bullets: [
              "Standardized SOPs across fulfillment operations and reduced order-processing errors by 22%.",
              "Built weekly performance reviews with KPI dashboards for throughput, SLA, and quality metrics.",
              "Collaborated with finance and procurement to optimize vendor costs while maintaining service levels."
            ]
          }
        ],
        [
          {
            id: createId(),
            institution: "Regional College",
            degree: "BBA in Operations Management",
            startDate: "2015",
            endDate: "2019"
          }
        ],
        [
          {
            id: createId(),
            name: "Dispatch Efficiency Program",
            description:
              "Designed a dispatch planning model to improve routing consistency and reduce delays.",
            link: "",
            technologies: ["Excel", "Process Mapping", "Reporting"],
            bullets: [
              "Tracked route adherence and turnaround time through weekly operational scorecards.",
              "Delivered measurable cycle-time improvements through process redesign."
            ]
          }
        ]
      )
  },
  {
    id: "early-career",
    icon: "EC",
    name: "Early Career ATS",
    fit: "Internship, graduate, and entry-level roles.",
    highlights: ["Strong fundamentals", "Project-based evidence", "Recruiter-friendly phrasing"],
    build: (email?: string) =>
      withStarterBasics(
        email,
        "Entry-Level Resume",
        "Motivated early-career candidate with hands-on project experience, strong communication skills, and a track record of learning quickly in collaborative environments.",
        ["Communication", "Problem Solving", "Research", "Microsoft Excel", "Team Collaboration", "Time Management"],
        [
          {
            id: createId(),
            company: "Campus Innovation Lab",
            title: "Project Intern",
            startDate: "2025",
            endDate: "2025",
            current: false,
            bullets: [
              "Supported project planning and status tracking for student-led product initiatives.",
              "Prepared weekly progress summaries and presented outcomes to faculty mentors.",
              "Assisted in testing workflows and documenting improvement recommendations."
            ]
          }
        ],
        [
          {
            id: createId(),
            institution: "University Name",
            degree: "Bachelors Degree",
            startDate: "2022",
            endDate: "2026"
          }
        ],
        [
          {
            id: createId(),
            name: "Portfolio Capstone Project",
            description:
              "Built a structured portfolio project demonstrating research, planning, and execution skills.",
            link: "",
            technologies: ["Documentation", "Presentation", "Data Analysis"],
            bullets: [
              "Defined project milestones and delivered final results on schedule.",
              "Synthesized findings into concise recommendations for stakeholders."
            ]
          }
        ]
      )
  }
];

export default function DashboardPage() {
  return (
    <AuthGuard
      title="Dashboard"
      unauthenticatedContent={<LoggedOutValueSection />}
    >
      <DashboardContent />
    </AuthGuard>
  );
}

function LoggedOutValueSection() {
  const points = [
    "Built for ATS parsing, not visual clutter.",
    "Smart keyword matching so every application is role-specific.",
    "AI suggestions with review controls, not uncontrolled rewrites.",
    "DOCX + PDF exports recruiters can read in seconds."
  ];

  return (
    <section
      className="card space-y-4 p-6"
      style={{
        fontFamily:
          '"Manrope", "Inter", var(--font-sans), system-ui, sans-serif'
      }}
    >
      <StatusBadge label="Why ResumeForge" tone="success" className="w-fit" />
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        Outperform generic resume builders with a workflow built to get interviews.
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-slate-600">
        ResumeForge is made for fast, focused applications. You get cleaner structure,
        stronger keyword coverage, and smarter edits without sacrificing control over your story.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {points.map((point) => (
          <article
            key={point}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <p className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              {point}
            </p>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/resume/new" className="btn-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          Start Your First Resume
        </Link>
        <Link href="/?auth=login#auth-panel" className="btn-secondary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Sign In to Continue
        </Link>
      </div>
    </section>
  );
}

function DashboardContent() {
  const auth = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleApiError(err: unknown, fallbackMessage: string) {
    if (isInvalidTokenError(err)) {
      auth.logout();
      setItems([]);
      setError("Session expired. Please sign in again.");
      router.replace("/?auth=login#auth-panel");
      return;
    }
    setError(err instanceof Error ? err.message : fallbackMessage);
  }

  async function load() {
    if (!auth.token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.listResumes(auth.token);
      setItems(response.items);
    } catch (err) {
      handleApiError(err, "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  async function createBlankResume() {
    if (!auth.token) {
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await api.createResume(createStarterResume(auth.email ?? undefined), auth.token);
      router.push(`/resume/${created.id}/edit`);
    } catch (err) {
      handleApiError(err, "Failed to create resume.");
    } finally {
      setCreating(false);
    }
  }

  async function createFromTemplate(templateId: string) {
    if (!auth.token) {
      return;
    }
    const template = TEMPLATE_OPTIONS.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    setCreatingTemplateId(templateId);
    setError("");
    try {
      const created = await api.createResume(template.build(auth.email ?? undefined), auth.token);
      router.push(`/resume/${created.id}/edit`);
    } catch (err) {
      handleApiError(err, "Failed to create resume from template.");
    } finally {
      setCreatingTemplateId(null);
    }
  }

  async function duplicateResume(id: string) {
    if (!auth.token) {
      return;
    }
    setError("");
    try {
      await api.duplicateResume(id, auth.token);
      await load();
    } catch (err) {
      handleApiError(err, "Failed to duplicate resume.");
    }
  }

  async function deleteResume(id: string) {
    if (!auth.token) {
      return;
    }
    const confirmed = window.confirm("Delete this resume?");
    if (!confirmed) {
      return;
    }
    setError("");
    try {
      await api.deleteResume(id, auth.token);
      await load();
    } catch (err) {
      handleApiError(err, "Failed to delete resume.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Build, optimize, and export ATS-ready resumes faster.</p>
        </div>
        <button className="btn-primary px-5 py-2.5" onClick={createBlankResume} disabled={creating}>
          <FilePlus2 className="h-4 w-4" aria-hidden />
          {creating ? "Creating..." : "Create New Resume"}
        </button>
      </div>

      {loading ? <div className="card p-4 text-sm text-slate-600">Loading resumes...</div> : null}
      {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-xl">ATS-Friendly Templates</h2>
          <StatusBadge label="Role-specific starters" tone="info" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATE_OPTIONS.map((template) => (
            <ResumeTemplateCard
              key={template.id}
              icon={template.icon}
              name={template.name}
              fit={template.fit}
              highlights={template.highlights}
              onSelect={() => createFromTemplate(template.id)}
              disabled={Boolean(creatingTemplateId)}
              isCreating={creatingTemplateId === template.id}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-xl">Your Resumes</h2>
          <p className="text-sm text-slate-600">{items.length} saved resume{items.length === 1 ? "" : "s"}</p>
        </div>

        {!loading && !items.length ? (
          <EmptyState
            title="No resumes yet"
            description="Create your first ATS-ready resume or start from a template above."
            action={
              <button className="btn-primary" onClick={createBlankResume} disabled={creating}>
                <FilePlus2 className="h-4 w-4" aria-hidden />
                {creating ? "Creating..." : "Create Resume"}
              </button>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((resume) => {
            const completion = getCompletionPercent({ title: resume.title, content: resume.content });
            const status = getResumeStatus(completion);
            return (
              <article key={resume.id} className="card card-hover space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{resume.title}</h3>
                    <p className="text-sm text-slate-600">
                      {resume.content.basics.fullName || "Unnamed candidate"}
                    </p>
                  </div>
                  <StatusBadge label={status.label} tone={status.tone} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Completion</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${completion}%` }} />
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    Updated {new Date(resume.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/resume/${resume.id}/edit`} className="btn-primary">
                    <WandSparkles className="h-4 w-4" aria-hidden />
                    Edit
                  </Link>
                  <Link href={`/resume/${resume.id}/match`} className="btn-secondary">
                    <ScanSearch className="h-4 w-4" aria-hidden />
                    Match
                  </Link>
                  <Link href={`/resume/${resume.id}/preview`} className="btn-secondary">
                    <Eye className="h-4 w-4" aria-hidden />
                    Preview
                  </Link>
                  <button className="btn-tertiary" onClick={() => duplicateResume(resume.id)}>
                    <Copy className="h-4 w-4" aria-hidden />
                    Duplicate
                  </button>
                  <button className="btn-tertiary text-rose-600 hover:bg-rose-50" onClick={() => deleteResume(resume.id)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
