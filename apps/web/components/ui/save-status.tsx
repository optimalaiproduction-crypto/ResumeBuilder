import { AlertCircle, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

function formatTime(value: Date | null) {
  if (!value) {
    return "Not saved yet";
  }
  return `Last saved at ${value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function SaveStatus({
  state,
  lastSavedAt,
  hasUnsavedChanges
}: {
  state: SaveState;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
}) {
  let text = "Ready";
  let tone = "text-slate-600";
  let Icon = Clock3;

  if (state === "saving") {
    text = "Autosaving changes...";
    tone = "text-brand-700";
    Icon = LoaderCircle;
  } else if (state === "saved") {
    text = "All changes saved";
    tone = "text-emerald-700";
    Icon = CheckCircle2;
  } else if (state === "error") {
    text = "Save failed";
    tone = "text-rose-700";
    Icon = AlertCircle;
  } else if (hasUnsavedChanges) {
    text = "Unsaved changes";
    tone = "text-amber-700";
    Icon = AlertCircle;
  } else if (lastSavedAt) {
    text = "All changes saved";
    tone = "text-emerald-700";
    Icon = CheckCircle2;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
      <p className={`flex items-center gap-2 font-medium ${tone}`}>
        <Icon className={`h-4 w-4 ${state === "saving" ? "animate-spin" : ""}`} aria-hidden />
        {text}
      </p>
      <p className="mt-1 text-xs text-slate-500">{formatTime(lastSavedAt)}</p>
    </div>
  );
}
