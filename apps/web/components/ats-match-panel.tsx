import Link from "next/link";
import { Sparkles, Target } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";

export function ATSMatchPanel({
  resumeId,
  completion,
  issues,
  active = false,
  matchReady = false
}: {
  resumeId: string;
  completion: number;
  issues: string[];
  active?: boolean;
  matchReady?: boolean;
}) {
  const readiness =
    completion >= 85 ? { label: "High readiness", tone: "success" as const } : completion >= 60
      ? { label: "Moderate readiness", tone: "info" as const }
      : { label: "Needs work", tone: "warning" as const };

  return (
    <div
      className={`space-y-3 rounded-xl border px-3 py-3 transition-all duration-200 ${
        active
          ? "border-brand-300 bg-brand-100/70 shadow-[0_0_0_2px_rgba(11,152,209,0.14),0_12px_26px_rgba(15,23,42,0.12)]"
          : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="section-title flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-brand-700" aria-hidden />
          ATS Match Readiness
        </h3>
        <StatusBadge label={readiness.label} tone={readiness.tone} />
      </div>

      <p className="text-sm text-slate-600">
        Completion score: <span className="font-semibold text-slate-900">{completion}%</span>
      </p>

      {issues.length ? (
        <ul className="space-y-1 text-sm text-slate-700">
          {issues.slice(0, 4).map((issue) => (
            <li key={issue}>- {issue}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-emerald-700">Great baseline. Run ATS match for keyword coverage.</p>
      )}

      <Link href={`/resume/${resumeId}/match`} className="btn-primary w-full">
        <Sparkles className="h-4 w-4" aria-hidden />
        Match & AI Optimization
      </Link>
    </div>
  );
}
