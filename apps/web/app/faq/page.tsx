"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How do I start creating a resume in ResumeForge?",
    answer:
      "Sign in, open your dashboard, and click Create New Resume. You can then fill in each section step-by-step and preview changes live."
  },
  {
    question: "Are the templates ATS-friendly?",
    answer:
      "Yes. ResumeForge templates are designed for clean, single-column parsing with consistent section labels to improve ATS readability."
  },
  {
    question: "Can I edit every section of my resume?",
    answer:
      "Yes. You can edit basics, summary, skills, work experience, education, projects, and certifications, then review everything in the preview panel."
  },
  {
    question: "How does keyword matching work?",
    answer:
      "Paste a target job description in Match mode. ResumeForge extracts likely ATS keywords, compares them against your resume, and highlights matched and missing terms."
  },
  {
    question: "Do AI suggestions change my resume automatically?",
    answer:
      "No. Suggestions are review-first. You choose whether to apply each rewrite so your final resume stays in your control."
  },
  {
    question: "Can I export my resume?",
    answer:
      "Yes. You can export your resume in DOCX and PDF formats designed to stay recruiter-readable and ATS-safe."
  },
  {
    question: "I forgot my password. What should I do?",
    answer:
      "Use the Forgot Password link on the sign-in form, submit your email, then reset your password using the token or link provided."
  },
  {
    question: "Will ResumeForge store my login and resume data?",
    answer:
      "ResumeForge stores account and resume data needed to provide editing, matching, and export features. See the Privacy Policy page for details."
  },
  {
    question: "Can I use ResumeForge on mobile devices?",
    answer:
      "Yes. The app is responsive and supports mobile and tablet workflows, though full editing is generally more comfortable on larger screens."
  },
  {
    question: "How can I get support?",
    answer:
      "Use the Contact page to send support questions. We usually respond within one business day."
  }
];

export default function FaqPage() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="card p-6 sm:p-7">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
          Help Center
        </span>
        <h1 className="page-title mt-3 text-3xl">Frequently Asked Questions</h1>
        <p className="page-subtitle">
          Quick answers about resumes, templates, matching, exports, account access, and data handling.
        </p>
      </header>

      <div className="card p-3 sm:p-4">
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-answer-${index}`;

            return (
              <article
                key={item.question}
                className={`rounded-xl border px-4 py-3 transition-colors duration-200 ${
                  isOpen
                    ? "border-brand-200 bg-brand-50/30"
                    : "border-slate-200 bg-white hover:border-brand-100"
                }`}
              >
                <h2>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                  >
                    <span className="text-base font-semibold text-slate-900">{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-700" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </h2>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={contentId}
                      key={contentId}
                      initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0, y: 6 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }}
                      transition={{ duration: prefersReducedMotion ? 0.12 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
