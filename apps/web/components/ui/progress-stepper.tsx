import Link from "next/link";
import { Check } from "lucide-react";

export type ProgressStep = {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
  targetId?: string;
};

export function ProgressStepper({
  steps,
  activeStepId,
  onStepSelect
}: {
  steps: ProgressStep[];
  activeStepId: string;
  onStepSelect?: (step: ProgressStep) => void;
}) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Resume Workflow
        </p>
      </div>
      <ol className="grid gap-3 px-4 py-4 md:grid-cols-6">
        {steps.map((step) => {
          const isActive = step.id === activeStepId;
          const circleClass = isActive
            ? "border-brand-300 bg-brand-100 text-brand-700 ring-2 ring-brand-200"
            : step.completed
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-500";

          const labelClass = isActive
            ? "font-semibold text-brand-700"
            : step.completed
              ? "text-brand-700"
              : "text-slate-600";
          const itemClass = isActive
            ? "border-brand-200 bg-brand-100/75 shadow-[0_2px_10px_rgba(11,152,209,0.20)]"
            : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50";

          const content = (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${circleClass}`}
              >
                {step.completed ? <Check className="h-4 w-4" aria-hidden /> : step.label.slice(0, 1)}
              </span>
              <span className={`text-sm font-medium ${labelClass}`}>{step.label}</span>
            </div>
          );

          return (
            <li key={step.id}>
              {onStepSelect ? (
                <button
                  type="button"
                  className={`group block w-full rounded-lg border p-2 text-left transition-all duration-200 ${itemClass}`}
                  onClick={() => onStepSelect(step)}
                >
                  {content}
                </button>
              ) : step.href ? (
                <Link
                  href={step.href}
                  className={`group block rounded-lg border p-2 transition-all duration-200 ${itemClass}`}
                >
                  {content}
                </Link>
              ) : (
                <div className={`rounded-lg border p-2 ${itemClass}`}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
