import { StatusBadge } from "@/components/ui/status-badge";

export function ResumeTemplateCard({
  icon,
  name,
  fit,
  highlights,
  onSelect,
  disabled,
  isCreating
}: {
  icon: string;
  name: string;
  fit: string;
  highlights: string[];
  onSelect: () => void;
  disabled: boolean;
  isCreating: boolean;
}) {
  return (
    <article className="card card-hover group space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            {icon}
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{fit}</p>
          </div>
        </div>
        <StatusBadge label="ATS-safe" tone="success" />
      </div>

      <ul className="space-y-1.5 text-sm text-slate-700">
        {highlights.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>

      <button className="btn-primary w-full" disabled={disabled} onClick={onSelect}>
        {isCreating ? "Creating..." : "Use Template"}
      </button>
    </article>
  );
}
