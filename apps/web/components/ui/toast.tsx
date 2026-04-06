"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type ToastTone = "success" | "error" | "info";

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-brand-200 bg-brand-50 text-brand-800"
};

export function Toast({
  message,
  tone = "info",
  onClose,
  durationMs = 2600
}: {
  message: string;
  tone?: ToastTone;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertTriangle : Info;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-soft transition-all duration-200 ${toneClasses[tone]}`}
        role="status"
        aria-live="polite"
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </div>
    </div>
  );
}
