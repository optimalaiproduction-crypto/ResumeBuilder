import { AlertTriangle, CheckCircle2, Circle, Info } from "lucide-react";

type StatusTone = "neutral" | "info" | "success" | "warning";

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-brand-50 text-brand-800 border-brand-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200"
};

export function StatusBadge({
  label,
  tone = "neutral",
  withIcon = true,
  className = ""
}: {
  label: string;
  tone?: StatusTone;
  withIcon?: boolean;
  className?: string;
}) {
  const icon = tone === "success"
    ? CheckCircle2
    : tone === "warning"
      ? AlertTriangle
      : tone === "info"
        ? Info
        : Circle;

  const Icon = icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${toneStyles[tone]} ${className}`}
    >
      {withIcon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </span>
  );
}
