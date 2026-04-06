export function StickyPreviewPanel({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <aside className="space-y-3 xl:sticky xl:top-24">
      <div className="card p-4">
        <h2 className="section-title text-base">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
      {footer ? <div className="card p-4">{footer}</div> : null}
    </aside>
  );
}
