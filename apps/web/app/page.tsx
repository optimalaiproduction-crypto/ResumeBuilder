"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, FileText, Github, LayoutList, Linkedin, Mail, MapPin, ScanSearch, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

const ease = [0.16, 1, 0.3, 1] as const;
const roleSwitchEase = [0.22, 1, 0.36, 1] as const;
const section = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };
const card = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } };

const roles = [
  {
    id: "se",
    label: "Software Engineer",
    name: "Arjun Mehta",
    role: "Staff Software Engineer",
    summary:
      "Backend engineer focused on resilient API platforms, low-latency data services, and production-grade release velocity for high-growth SaaS products.",
    roleNote: "Platform architecture, performance tuning, and developer productivity.",
    stats: [
      { label: "Uptime", value: "99.95%" },
      { label: "Query Speed", value: "+38%" },
      { label: "APIs", value: "26 live" }
    ],
    focus: ["Distributed Systems", "API Performance", "Reliability Engineering"],
    skills: ["Python", "FastAPI", "TypeScript", "PostgreSQL", "Docker", "Redis", "Kafka"],
    bullets: [
      "Re-architected service boundaries to cut p95 response time by 38% across core customer flows.",
      "Implemented contract testing and canary deployment guardrails, reducing release regressions by 41%.",
      "Built observability playbooks that brought mean-time-to-detect incidents down by 35%."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "arjun.mehta@example.com",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/arjun-mehta",
      github: "github.com/arjunmehta-dev"
    }
  },
  {
    id: "pm",
    label: "Product Manager",
    name: "Elena Park",
    role: "Senior Product Manager",
    summary:
      "Product leader driving roadmap clarity, experimentation velocity, and cross-functional execution across onboarding, growth, and retention surfaces.",
    roleNote: "Outcome-focused discovery, stakeholder alignment, and delivery discipline.",
    stats: [
      { label: "Activation", value: "+22%" },
      { label: "Cycle Time", value: "-31%" },
      { label: "Experiments", value: "48/yr" }
    ],
    focus: ["Roadmap Strategy", "Experiment Design", "Cross-functional Leadership"],
    skills: ["Product Analytics", "A/B Testing", "SQL", "Amplitude", "Jira", "Figma"],
    bullets: [
      "Redesigned activation funnel and prioritized roadmap bets that lifted Week-1 activation by 22%.",
      "Built a decision framework that aligned engineering, design, and GTM teams on measurable release goals.",
      "Scaled experimentation workflow to 48 validated tests per year with tighter learning cycles."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "elena.park@example.com",
      location: "New York, NY",
      linkedin: "linkedin.com/in/elena-park-pm",
      github: "github.com/elenapark-product"
    }
  },
  {
    id: "mm",
    label: "Marketing Manager",
    name: "Sofia Ramirez",
    role: "Growth Marketing Lead",
    summary:
      "Growth marketer who scales pipeline through full-funnel campaign strategy, lifecycle optimization, and performance storytelling tied to revenue outcomes.",
    roleNote: "Demand generation, paid acquisition, and lifecycle conversion.",
    stats: [
      { label: "Pipeline", value: "+36%" },
      { label: "CAC", value: "-19%" },
      { label: "ROAS", value: "3.1x" }
    ],
    focus: ["Funnel Optimization", "Lifecycle Journeys", "Attribution Modeling"],
    skills: ["Paid Media", "SEO", "HubSpot", "GA4", "Attribution", "Lifecycle CRM"],
    bullets: [
      "Launched channel mix strategy that increased qualified pipeline by 36% quarter-over-quarter.",
      "Rebuilt lifecycle segmentation and messaging logic to reduce CAC by 19% while improving conversion quality.",
      "Created executive marketing scorecards connecting campaign spend to pipeline and closed-won revenue."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "sofia.ramirez@example.com",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/sofia-ramirez-growth",
      github: "github.com/sofia-growth"
    }
  },
  {
    id: "gd",
    label: "Graphic Designer",
    name: "Jordan Lee",
    role: "Product & Brand Designer",
    summary:
      "Designs conversion-minded product visuals and brand systems that improve clarity, consistency, and speed across digital touchpoints.",
    roleNote: "Interface systems, visual storytelling, and creative operations.",
    stats: [
      { label: "CTR", value: "+21%" },
      { label: "Turnaround", value: "-24%" },
      { label: "Adoption", value: "5 teams" }
    ],
    focus: ["Design Systems", "Growth Creative", "Cross-team Delivery"],
    skills: ["Figma", "Illustrator", "After Effects", "Brand Systems", "Prototyping"],
    bullets: [
      "Built reusable component and template libraries adopted by five teams across product and marketing.",
      "Led creative refresh for demand campaigns that increased click-through rate by 21%.",
      "Streamlined design operations to reduce asset production turnaround by 24%."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "jordan.lee@example.com",
      location: "New York, NY",
      linkedin: "linkedin.com/in/jordanlee",
      github: "github.com/jordan-design"
    }
  },
  {
    id: "da",
    label: "Data Analyst",
    name: "Nina Patel",
    role: "Senior Data Analyst",
    summary:
      "Analytics partner to growth and finance teams, translating noisy performance data into decision-ready insights, forecasting confidence, and measurable execution plans.",
    roleNote: "Executive KPI reporting, experimentation analysis, and planning support.",
    stats: [
      { label: "Reporting Time", value: "-10h/wk" },
      { label: "Forecast Accuracy", value: "+14%" },
      { label: "KPI Dashboards", value: "12 live" }
    ],
    focus: ["BI Dashboards", "Experimentation", "Revenue Forecasting"],
    skills: ["SQL", "Python", "Power BI", "A/B Testing", "Looker", "dbt"],
    bullets: [
      "Built executive KPI dashboards that reduced weekly reporting effort and improved planning confidence.",
      "Partnered with growth and finance to uncover revenue leakage and prioritize high-impact interventions.",
      "Designed metric QA checks that improved forecast accuracy by 14% across quarter planning cycles."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "nina.patel@example.com",
      location: "Seattle, WA",
      linkedin: "linkedin.com/in/ninapatel",
      github: "github.com/nina-analytics"
    }
  },
  {
    id: "hr",
    label: "HR Manager",
    name: "Ethan Cruz",
    role: "People Operations Manager",
    summary:
      "People Ops leader improving hiring velocity, onboarding quality, and retention outcomes through scalable programs and manager enablement.",
    roleNote: "Talent operations, employee programs, and performance enablement.",
    stats: [
      { label: "Time-to-hire", value: "-22%" },
      { label: "Retention", value: "+19%" },
      { label: "Onboarding NPS", value: "+23%" }
    ],
    focus: ["Talent Operations", "Onboarding Design", "Retention Programs"],
    skills: ["HRIS", "Greenhouse", "Onboarding", "Performance Programs", "Policy Design"],
    bullets: [
      "Rebuilt recruiter and hiring-manager workflow, cutting average time-to-hire by 22%.",
      "Designed first-90-day onboarding program that increased retention and manager confidence in ramp timelines.",
      "Implemented people health reviews that improved engagement visibility and proactive support planning."
    ],
    availability: "Open to opportunities",
    contact: {
      email: "ethan.cruz@example.com",
      location: "Chicago, IL",
      linkedin: "linkedin.com/in/ethancruz",
      github: "github.com/ethan-ops"
    }
  }
];

const steps = [
  { title: "Build your resume basics", subtitle: "Clean header, contact details, and a targeted summary." },
  { title: "Add impact-driven experience", subtitle: "Write outcome-focused bullets with clear measurable results." },
  { title: "Match against job posts", subtitle: "Extract ATS keywords and close content gaps quickly." },
  { title: "Export and apply confidently", subtitle: "Download ATS-safe DOCX/PDF ready for recruiter review." }
];

const galleryTemplates = [
  {
    id: "software-engineer-ats",
    icon: "SE",
    title: "Software Engineer ATS",
    description: "Backend, full-stack, and platform roles.",
    highlights: [
      "Keyword-friendly Python/FastAPI structure.",
      "Impact-first bullet flow for measurable outcomes.",
      "Project-ready layout for technical work samples."
    ],
    tags: ["Summary", "Skills", "Experience", "Projects", "Certifications"]
  },
  {
    id: "data-analyst-ats",
    icon: "DA",
    title: "Data Analyst ATS",
    description: "Analytics, BI, and reporting roles.",
    highlights: [
      "SQL-heavy profile sections for analyst screening.",
      "Metrics-first bullet structure for measurable impact.",
      "Recruiter-friendly narrative for insight communication."
    ],
    tags: ["Summary", "Experience", "Analytics", "Projects", "Education"]
  },
  {
    id: "product-manager-ats",
    icon: "PM",
    title: "Product Manager ATS",
    description: "Product, growth, and strategy roles.",
    highlights: [
      "Cross-functional impact storytelling for PM hiring teams.",
      "Roadmap ownership and outcome framing.",
      "Customer-centric keyword placement throughout sections."
    ],
    tags: ["Summary", "Leadership", "Experience", "Projects", "Skills"]
  }
];

type HomeTemplate = (typeof galleryTemplates)[number];
const heroHeadlineLines = ["Build role-targeted resumes with", "ATS confidence."];

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function HomePage() {
  const reduced = useReducedMotion() ?? false;
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id ?? "");
  const activeRoleIndex = Math.max(
    0,
    roles.findIndex((role) => role.id === activeRoleId)
  );
  const sample = roles[activeRoleIndex] ?? roles[0];
  const rp = reduced ? {} : ({ initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 } } as const);

  useEffect(() => {
    if (reduced || roles.length < 2) {
      return;
    }

    const rotateRoles = window.setInterval(() => {
      setActiveRoleId((current) => {
        const currentIndex = roles.findIndex((role) => role.id === current);
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        return roles[(safeIndex + 1) % roles.length]?.id ?? roles[0].id;
      });
    }, 3200);

    return () => window.clearInterval(rotateRoles);
  }, [reduced]);

  return (
    <div className="space-y-12 pb-10">
      <div className="grid items-stretch gap-8 lg:grid-cols-2">
        <motion.section
          className="card h-full overflow-hidden p-0"
          initial={reduced ? undefined : { opacity: 0, y: 12, scale: 0.995 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease }}
        >
          <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700 px-8 py-8 text-white">
            <motion.div
              className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-r from-white/10 via-transparent to-white/10"
              animate={reduced ? undefined : { x: ["-20%", "20%", "-20%"] }}
              transition={reduced ? undefined : { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.p
              className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
              initial={reduced ? undefined : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: reduced ? 0 : 0.1, ease }}
            >
              ResumeForge
            </motion.p>
            <AnimatedHeroHeadline lines={heroHeadlineLines} reduced={reduced} />
            <motion.p
              className="mt-3 max-w-2xl text-sm leading-6 text-white/85"
              initial={reduced ? undefined : { opacity: 0, y: 10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: reduced ? 0 : 0.34, ease }}
            >
              Structured editing, keyword-aware matching, and recruiter-friendly exports in one focused workflow.
            </motion.p>
          </div>

          <div className="space-y-6 p-8">
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduced ? 0 : 0.48, ease }}
            >
              <StatusBadge label="ATS-friendly resume builder powered by AI" tone="success" className="w-fit" />
            </motion.div>

            <div className="flex flex-wrap gap-3">
              <motion.div
                initial={reduced ? undefined : { opacity: 0, y: 10 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: reduced ? 0 : 0.58, ease }}
              >
                <Link href="/resume/new" className="btn-primary px-5 py-2.5">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Start Building
                </Link>
              </motion.div>
              <motion.div
                initial={reduced ? undefined : { opacity: 0, y: 10 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: reduced ? 0 : 0.66, ease }}
              >
                <Link href="/dashboard" className="btn-secondary px-5 py-2.5">
                  <FileText className="h-4 w-4" aria-hidden />
                  Open Dashboard
                </Link>
              </motion.div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Resume Sections", value: "7 core sections" },
                { label: "Export Formats", value: "DOCX and PDF" },
                { label: "Workflow", value: "Edit -> Match -> Export" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={reduced ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : 0.74 + index * 0.09, ease }}
                >
                  <TrustStat label={item.label} value={item.value} />
                </motion.div>
              ))}
            </div>
            <HowItWorks reduced={reduced} />
          </div>
        </motion.section>

        <motion.aside
          className="card h-full space-y-4 p-5"
          initial={reduced ? undefined : { opacity: 0, y: 20, x: 8 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.52, delay: reduced ? 0 : 0.38, ease }}
        >
          <motion.div
            className="rounded-2xl border border-slate-200/70 bg-slate-100/70 p-4 md:p-5"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reduced ? 0 : 0.74, ease }}
            whileHover={reduced ? undefined : { y: -2 }}
          >
            <motion.div
              animate={reduced ? undefined : { y: [0, -3, 0] }}
              transition={reduced ? undefined : { duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.aside
                  key={sample.id}
                  className="paper-panel group relative flex min-h-[370px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(15,23,42,0.12)]"
                  initial={reduced ? undefined : { opacity: 0, y: 8, scale: 0.995 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.995 }}
                  transition={{ duration: 0.26, ease: roleSwitchEase }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-sky-50/85 via-brand-50/65 to-transparent" />
                  <header className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sm font-semibold tracking-wide text-sky-700 shadow-sm">
                        {initialsFromName(sample.name)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[1.7rem] font-semibold leading-tight tracking-tight text-slate-950">{sample.name}</h3>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.17em] text-sky-700">{sample.role}</p>
                        <p className="mt-1 max-w-[34ch] text-xs leading-5 text-slate-600">{sample.roleNote}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-medium text-emerald-700">
                      {sample.availability}
                    </span>
                  </header>

                  <section className="mt-3 min-h-[84px] rounded-2xl bg-slate-50/85 px-3.5 py-2.5">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Summary</h4>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">{sample.summary}</p>
                  </section>

                  <section className="mt-3 min-h-[64px]">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Impact Snapshot</h4>
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                      {sample.stats.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-slate-200/80 bg-white/95 p-2.5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                        >
                          <p className="text-base font-semibold leading-tight text-slate-900">{item.value}</p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mt-3 min-h-[64px]">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Role Focus</h4>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {sample.focus.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition-colors duration-200 group-hover:bg-sky-100/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="mt-3 min-h-[64px]">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Tech Stack</h4>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {sample.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="mt-3 min-h-[90px] rounded-2xl bg-slate-50/85 p-3.5">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Highlights</h4>
                    <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-700">
                      {sample.bullets.slice(0, 2).map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="mt-auto border-t border-slate-200/80 pt-3">
                    <div className="flex flex-col gap-3 text-xs text-slate-600 sm:flex-row sm:items-start sm:justify-between">
                      <ul className="space-y-1.5">
                        <li className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          {sample.contact.email}
                        </li>
                        <li className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          {sample.contact.location}
                        </li>
                      </ul>
                      <ul className="space-y-1.5 sm:text-right">
                        <li className="inline-flex items-center gap-1.5 sm:justify-end">
                          <Linkedin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          <span className="text-slate-600 transition-colors duration-200 hover:text-slate-900">{sample.contact.linkedin}</span>
                        </li>
                        <li className="inline-flex items-center gap-1.5 sm:justify-end">
                          <Github className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          <span className="text-slate-600 transition-colors duration-200 hover:text-slate-900">{sample.contact.github}</span>
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
                    <fieldset className="flex items-center">
                      <legend className="sr-only">Choose role sample</legend>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {roles.map((role) => {
                          const checked = role.id === sample.id;

                          return (
                            <label key={role.id} className="inline-flex cursor-pointer items-center justify-center p-1" title={role.label}>
                              <input
                                type="radio"
                                name="role-sample"
                                value={role.id}
                                className="sr-only"
                                checked={checked}
                                onChange={() => setActiveRoleId(role.id)}
                              />
                              <motion.span
                                className={`inline-flex h-2.5 w-2.5 rounded-full border transition-all duration-200 ${
                                  checked
                                    ? "border-slate-700 bg-slate-700"
                                    : "border-slate-400 bg-transparent hover:border-slate-600"
                                }`}
                                animate={
                                  reduced
                                    ? undefined
                                    : checked
                                      ? { scale: [1, 1.14, 1], boxShadow: "0 0 0 3px rgba(100,116,139,0.22)" }
                                      : { scale: 1, boxShadow: "0 0 0 0 rgba(100,116,139,0)" }
                                }
                                transition={{ duration: checked ? 0.28 : 0.18, ease: roleSwitchEase }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </section>
                </motion.aside>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.aside>
      </div>

      <motion.section className="card p-6" variants={section} {...rp}>
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="section-title text-xl">Trusted Value for Every Application</h2><StatusBadge label="Built for ATS + Recruiters" tone="info" /></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ValueCard icon={ShieldCheck} title="ATS-safe formatting" desc="Clean parsing with consistent structure." />
          <ValueCard icon={FileText} title="Structured editor" desc="Section-by-section workflow for clarity." />
          <ValueCard icon={ScanSearch} title="Keyword matching" desc="Find missing terms before applying." />
          <ValueCard icon={LayoutList} title="Guided flow" desc="Edit, match, and export in one place." />
        </div>
      </motion.section>

      <TemplateGallery reduced={reduced} />

      <motion.section className="card relative overflow-hidden p-6 md:p-7" variants={section} {...rp}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/65 via-brand-50/20 to-transparent" />
        <div className="pointer-events-none absolute -right-10 top-8 h-24 w-24 rounded-full bg-brand-100/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-8 h-24 w-24 rounded-full bg-sky-100/35 blur-2xl" />

        <div className="relative">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Core Capabilities</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Everything You Need to Build a Better Resume</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                From first draft to final export, ResumeForge keeps every step structured, ATS-safe, and recruiter-ready.
              </p>
            </div>
            <StatusBadge label="Built for speed + clarity" tone="info" className="mt-1" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FeatureHighlightCard icon={LayoutList} title="Structured resume editor" desc="Guided section inputs keep formatting clean and ATS-safe." />
            <FeatureHighlightCard icon={ScanSearch} title="Keyword extraction" desc="Map role requirements to your resume in seconds." />
            <FeatureHighlightCard icon={Target} title="Match insights" desc="Track alignment with missing keyword visibility." />
            <FeatureHighlightCard icon={FileText} title="Export-ready output" desc="Generate clean DOCX/PDF files recruiters can scan quickly." />
            <FeatureHighlightCard icon={CheckCircle2} title="Section health checks" desc="Catch missing essentials before you apply." />
          </div>
        </div>
      </motion.section>

      <motion.section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" variants={section} {...rp}>
        <div className="card p-6">
          <h2 className="section-title text-2xl">Designed for ATS Success</h2>
          <ul className="mt-3 space-y-2">{["Single-column structure improves parsing reliability.", "Keyword-aware writing improves job alignment.", "Clean exports stay recruiter-readable."].map((i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{i}</li>)}</ul>
        </div>
        <div className="card p-6">
          <h2 className="section-title text-2xl">Resume Section Coverage</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{["Summary", "Skills", "Work Experience", "Education", "Projects", "Certifications", "Links & Contact"].map((s) => <span key={s} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{s}</span>)}</div>
        </div>
      </motion.section>

      <motion.section className="card p-6" variants={section} {...rp}>
        <h2 className="section-title text-2xl">Export for Readability and Recruiter Confidence</h2>
        <ul className="mt-3 space-y-2">{["ATS-safe single-column output.", "Consistent heading structure.", "No visual clutter that hurts parsing.", "DOCX and PDF export support."].map((i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{i}</li>)}</ul>
      </motion.section>

      <motion.section className="card overflow-hidden p-0" variants={section} {...rp}>
        <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700 px-8 py-8 text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Build your next ATS-ready resume with confidence.</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/resume/new" className="btn-primary border border-white/20 bg-white/15 text-white hover:bg-white/20">Start Building <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/dashboard" className="btn-secondary border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">Open Dashboard</Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function HowItWorks({ reduced }: { reduced: boolean }) {
  const containerDelay = reduced ? 0 : 0.55;
  const [activeTick, setActiveTick] = useState(0);

  useEffect(() => {
    if (reduced) {
      setActiveTick(0);
      return;
    }

    const tickInterval = window.setInterval(() => {
      setActiveTick((prev) => (prev + 1) % steps.length);
    }, 1350);

    return () => window.clearInterval(tickInterval);
  }, [reduced]);

  return (
    <motion.section
      className="pt-2"
      initial={reduced ? undefined : { opacity: 0, y: 10 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: containerDelay, ease }}
    >
      <div className="mb-3">
        <h2 className="text-[1.35rem] font-semibold tracking-tight text-slate-900">How it works</h2>
      </div>
      <ol className="space-y-2.5">
        {steps.map((step, index) => {
          const isActive = activeTick === index;

          return (
          <li
            key={step.title}
            className="group relative flex items-start gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors duration-200 hover:border-slate-200 hover:bg-slate-50/90"
          >
            <span
              className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                isActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {!reduced && isActive ? (
                <motion.span
                  className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-transparent border-r-emerald-300/80 border-t-emerald-500/85"
                  animate={{ rotate: 360, opacity: [0.45, 0.95, 0.45] }}
                  transition={{ duration: 1.15, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                />
              ) : null}
              <motion.span
                animate={reduced ? undefined : isActive ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, ease }}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
              </motion.span>
            </span>
            <div className="min-w-0 flex-1">
              <span className="peer inline-block text-[1.02rem] font-semibold tracking-tight text-slate-900">
                {step.title}
              </span>
              <p className="mt-0.5 max-h-0 overflow-hidden text-[0.83rem] leading-5 text-slate-600 opacity-0 transition-all duration-300 peer-hover:max-h-10 peer-hover:opacity-100 group-focus:max-h-10 group-focus:opacity-100">
                {step.subtitle}
              </p>
            </div>
          </li>
          );
        })}
      </ol>
    </motion.section>
  );
}

function AnimatedHeroHeadline({ lines, reduced }: { lines: string[]; reduced: boolean }) {
  return (
    <h1 className="mt-4 text-4xl font-semibold leading-tight">
      {lines.map((line, lineIndex) => (
        <span key={line} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={reduced ? undefined : { y: "115%", opacity: 0 }}
            animate={reduced ? undefined : { y: "0%", opacity: 1 }}
            transition={{ duration: 0.46, delay: reduced ? 0 : 0.2 + lineIndex * 0.12, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function ValueCard({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return <motion.article className="rounded-xl border border-brand-100/70 bg-brand-50/30 p-4" variants={card}><Icon className="mb-2 h-4 w-4 text-brand-700" aria-hidden /><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-600">{desc}</p></motion.article>;
}

function FeatureHighlightCard({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <motion.article
      className="group relative rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]"
      variants={card}
    >
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200/80 bg-gradient-to-b from-brand-50 to-sky-50 text-brand-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">{desc}</p>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-brand-100/70 to-transparent" />
    </motion.article>
  );
}

function TrustStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>;
}

function TemplateGallery({ reduced }: { reduced: boolean }) {
  return (
    <motion.section
      id="template-gallery"
      className="card relative overflow-hidden scroll-mt-24"
      variants={section}
      initial={reduced ? undefined : "hidden"}
      whileInView={reduced ? undefined : "show"}
      viewport={reduced ? undefined : { once: true, amount: 0.18 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand-50/70 via-brand-50/20 to-transparent" />

      <div className="relative p-6 md:p-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Template Gallery
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              ATS-Friendly Templates
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a role starter, then personalize with your achievements.
            </p>
          </div>
          <StatusBadge label="Role-specific starters" tone="info" className="mt-1" />
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {galleryTemplates.map((template) => (
            <HomeTemplateCard key={template.id} template={template} />
          ))}
        </div>

        <div className="mt-6 flex justify-center lg:justify-end">
          <Link href="/dashboard?auth=login" className="btn-secondary px-5 py-2.5">
            View more templates
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

function HomeTemplateCard({ template }: { template: HomeTemplate }) {
  return (
    <article className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_20px_44px_rgba(15,23,42,0.14)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-brand-50/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex min-h-[120px] items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-brand-100/70 text-sm font-semibold text-brand-700 shadow-sm">
            {template.icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{template.title}</h3>
            <p className="mt-1 min-h-[54px] text-sm leading-6 text-slate-600">
              {template.description}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          ATS-safe
        </span>
      </div>

      <div className="mt-4 min-h-[178px] rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <ul className="space-y-2 text-sm text-slate-700">
          {template.highlights.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="leading-6">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 min-h-[72px] border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Link href="/dashboard?auth=login" className="btn-primary mt-auto w-full justify-center py-2.5">
        Sign in to use
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
