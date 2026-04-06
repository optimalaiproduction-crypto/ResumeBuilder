"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function SectionCard({
  sectionId,
  title,
  description,
  children,
  actions,
  badge,
  defaultOpen = true,
  active = false
}: {
  sectionId?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={sectionId}
      className={`card scroll-mt-28 overflow-hidden transition-all duration-200 ${
        active
          ? "border-brand-300 shadow-[0_0_0_2px_rgba(11,152,209,0.16),0_14px_28px_rgba(15,23,42,0.12)]"
          : ""
      }`}
    >
      <div
        className={`flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 ${
          active ? "border-brand-200 bg-brand-100/75" : "border-slate-200 bg-slate-50/80"
        }`}
      >
        <button
          type="button"
          className="text-left"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <h2 className="section-title text-base">{title}</h2>
            {badge}
          </div>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
        </button>
        <div className="flex items-center gap-2">
          <div
            onClickCapture={() => {
              if (!open) {
                setOpen(true);
              }
            }}
          >
            {actions}
          </div>
          <button
            type="button"
            className="btn-tertiary px-2.5 py-1.5"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {open ? <div className="space-y-3 p-5">{children}</div> : null}
    </section>
  );
}
