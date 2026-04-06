import { contactLine, dateRange, text, type ResumeTemplateData } from "@/components/templates/shared";

export function ATSClassicTemplate({ data }: { data: ResumeTemplateData }) {
  const basics = data.content.basics;
  const name = text(basics.fullName) || text(data.title) || "Resume";
  const headline = text(data.title);
  const contact = contactLine(data.content);

  return (
    <article className="paper-panel mx-auto max-w-4xl rounded-xl border border-slate-300 bg-white p-6 sm:p-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">{name}</h2>
        {headline && headline !== name ? <p className="mt-1 text-sm text-slate-700">{headline}</p> : null}
        {contact.length ? <p className="mt-1 text-sm text-slate-600">{contact.join(" | ")}</p> : null}
      </header>

      {text(data.content.summary) ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Summary</h3>
          <p className="mt-2 text-sm leading-6 text-slate-800">{text(data.content.summary)}</p>
        </section>
      ) : null}

      {data.content.workExperience.length ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Experience</h3>
          <div className="mt-2 space-y-3">
            {data.content.workExperience.map((item) => {
              const heading = [text(item.title), text(item.company)].filter(Boolean).join(" | ");
              const period = item.current ? dateRange(item.startDate, "Present") : dateRange(item.startDate, item.endDate);
              const bullets = item.bullets.map((bullet) => text(bullet)).filter(Boolean);
              if (!heading && !period && !bullets.length) {
                return null;
              }
              return (
                <article key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{heading}</p>
                    {period ? <p className="text-xs text-slate-600">{period}</p> : null}
                  </div>
                  {bullets.length ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {bullets.map((bullet, index) => (
                        <li key={`${item.id}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {data.content.education.length ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Education</h3>
          <div className="mt-2 space-y-2">
            {data.content.education.map((item) => {
              const line = [text(item.degree), text(item.institution)].filter(Boolean).join(" - ");
              const period = dateRange(item.startDate, item.endDate);
              if (!line && !period) {
                return null;
              }
              return (
                <article key={item.id} className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{line}</p>
                  {period ? <p className="text-xs text-slate-600">{period}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {data.content.skills.length ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Skills</h3>
          <p className="mt-2 text-sm leading-6 text-slate-800">{data.content.skills.map((item) => text(item)).filter(Boolean).join(", ")}</p>
        </section>
      ) : null}

      {data.content.projects.length ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Projects</h3>
          <div className="mt-2 space-y-3">
            {data.content.projects.map((item) => {
              const nameText = text(item.name);
              const description = text(item.description);
              const technologies = item.technologies.map((tech) => text(tech)).filter(Boolean);
              const bullets = item.bullets.map((bullet) => text(bullet)).filter(Boolean);
              const link = text(item.link);
              if (!nameText && !description && !technologies.length && !bullets.length && !link) {
                return null;
              }
              return (
                <article key={item.id}>
                  {nameText ? <p className="text-sm font-semibold text-slate-900">{nameText}</p> : null}
                  {technologies.length ? <p className="text-sm text-slate-700">Technologies: {technologies.join(", ")}</p> : null}
                  {description ? <p className="text-sm text-slate-800">{description}</p> : null}
                  {bullets.length ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {bullets.map((bullet, index) => (
                        <li key={`${item.id}-bullet-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {link ? (
                    <p className="mt-1 text-sm">
                      <a href={link} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                        {link}
                      </a>
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {data.content.certifications.length ? (
        <section className="mt-5">
          <h3 className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Certifications</h3>
          <div className="mt-2 space-y-2">
            {data.content.certifications.map((item) => {
              const line = [text(item.name), text(item.issuer)].filter(Boolean).join(" - ");
              const date = text(item.date);
              const link = text(item.link);
              if (!line && !date && !link) {
                return null;
              }
              return (
                <article key={item.id}>
                  <p className="text-sm font-semibold text-slate-900">
                    {line}
                    {date ? ` (${date})` : ""}
                  </p>
                  {link ? (
                    <p className="text-sm">
                      <a href={link} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                        {link}
                      </a>
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </article>
  );
}
