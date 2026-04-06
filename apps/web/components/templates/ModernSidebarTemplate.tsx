/* eslint-disable @next/next/no-img-element */
import { contactLine, dateRange, text, type ResumeTemplateData } from "@/components/templates/shared";

export function ModernSidebarTemplate({ data }: { data: ResumeTemplateData }) {
  const basics = data.content.basics;
  const name = text(basics.fullName) || text(data.title) || "Resume";
  const role = text(data.title);
  const contact = contactLine(data.content);
  const photoUrl = text(basics.photoUrl);
  const skills = data.content.skills.map((skill) => text(skill)).filter(Boolean);

  return (
    <article className="paper-panel mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{name}</h2>
            {role && role !== name ? <p className="mt-1 text-base font-medium text-slate-700">{role}</p> : null}
            {contact.length ? <p className="mt-2 text-sm text-slate-600">{contact.join(" • ")}</p> : null}
          </div>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="hidden h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover sm:block"
            />
          ) : null}
        </div>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profile"
            className="mt-3 h-16 w-16 rounded-xl border border-slate-200 object-cover sm:hidden"
          />
        ) : null}
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr,1fr]">
        <section className="space-y-5">
          {text(data.content.summary) ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Summary</h3>
              <p className="mt-2 text-sm leading-7 text-slate-800">{text(data.content.summary)}</p>
            </section>
          ) : null}

          {data.content.workExperience.length ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Experience</h3>
              <div className="mt-3 space-y-3">
                {data.content.workExperience.map((item) => {
                  const heading = [text(item.title), text(item.company)].filter(Boolean).join(" | ");
                  const period = item.current ? dateRange(item.startDate, "Present") : dateRange(item.startDate, item.endDate);
                  const bullets = item.bullets.map((bullet) => text(bullet)).filter(Boolean);
                  if (!heading && !period && !bullets.length) {
                    return null;
                  }
                  return (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/45 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{heading}</p>
                        {period ? <p className="text-xs font-medium text-slate-600">{period}</p> : null}
                      </div>
                      {bullets.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
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

          {data.content.projects.length ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Projects</h3>
              <div className="mt-3 space-y-3">
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
                    <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                      {nameText ? <p className="text-sm font-semibold text-slate-900">{nameText}</p> : null}
                      {technologies.length ? <p className="mt-1 text-xs text-slate-600">Technologies: {technologies.join(", ")}</p> : null}
                      {description ? <p className="mt-1 text-sm leading-6 text-slate-800">{description}</p> : null}
                      {bullets.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
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
        </section>

        <aside className="space-y-5">
          {skills.length ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Skills</h3>
              <p className="mt-2 text-sm leading-7 text-slate-800">{skills.join(", ")}</p>
            </section>
          ) : null}

          {data.content.education.length ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Education</h3>
              <div className="mt-2 space-y-2">
                {data.content.education.map((item) => {
                  const line = [text(item.degree), text(item.institution)].filter(Boolean).join(" - ");
                  const period = dateRange(item.startDate, item.endDate);
                  if (!line && !period) {
                    return null;
                  }
                  return (
                    <article key={item.id}>
                      <p className="text-sm font-semibold text-slate-900">{line}</p>
                      {period ? <p className="text-xs text-slate-600">{period}</p> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {data.content.certifications.length ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Certifications</h3>
              <div className="mt-2 space-y-2">
                {data.content.certifications.map((item) => {
                  const line = [text(item.name), text(item.issuer)].filter(Boolean).join(" - ");
                  const certDate = text(item.date);
                  const link = text(item.link);
                  if (!line && !certDate && !link) {
                    return null;
                  }
                  return (
                    <article key={item.id}>
                      <p className="text-sm font-semibold text-slate-900">
                        {line}
                        {certDate ? ` (${certDate})` : ""}
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
        </aside>
      </div>
    </article>
  );
}
