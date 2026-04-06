import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";

type ATSTemplateCardProps = {
  icon: string;
  title: string;
  description: string;
  highlights: string[];
  tags: string[];
  href: string;
  ctaLabel?: string;
};

export function ATSTemplateCard({
  icon,
  title,
  description,
  highlights,
  tags,
  href,
  ctaLabel = "Sign in to use"
}: ATSTemplateCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_38px_rgba(15,23,42,0.13)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-50/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-brand-100/60 text-sm font-semibold text-brand-700 shadow-sm">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-1 min-h-[52px] text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        <StatusBadge label="ATS-safe" tone="success" />
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
        <ul className="space-y-2 text-sm text-slate-700">
          {highlights.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="leading-6">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {tags.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <Link href={href} className="btn-primary mt-5 w-full justify-center py-2.5">
        {ctaLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
