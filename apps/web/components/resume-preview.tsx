/* eslint-disable @next/next/no-img-element */
import {
  BriefcaseBusiness,
  Languages,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound
} from "lucide-react";

import type { ResumeInput } from "@resumeforge/shared";

type CategorizedSkills = {
  technical: string[];
  tools: string[];
  frameworks: string[];
  soft: string[];
};

type PreviewSectionKey =
  | "basics"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications";

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(value);
  }

  return output;
}

function pickByKeywords(skills: string[], keywords: string[]) {
  return skills.filter((skill) => {
    const lower = skill.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword) || keyword.includes(lower));
  });
}

function categorizeSkills(skills: string[]): CategorizedSkills {
  const technicalKeywords = [
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "html",
    "css",
    "node",
    "api",
    "rest",
    "graphql",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "linux"
  ];

  const toolKeywords = [
    "excel",
    "figma",
    "tableau",
    "power bi",
    "jira",
    "notion",
    "photoshop",
    "illustrator",
    "postman",
    "github"
  ];

  const frameworkKeywords = [
    "react",
    "next",
    "vue",
    "angular",
    "fastapi",
    "django",
    "flask",
    "spring",
    "tailwind",
    "express"
  ];

  const softKeywords = [
    "communication",
    "leadership",
    "problem solving",
    "collaboration",
    "time management",
    "stakeholder",
    "adaptability",
    "teamwork"
  ];

  const technical = pickByKeywords(skills, technicalKeywords);
  const tools = pickByKeywords(skills, toolKeywords);
  const frameworks = pickByKeywords(skills, frameworkKeywords);
  const soft = pickByKeywords(skills, softKeywords);

  const used = new Set(
    [...technical, ...tools, ...frameworks, ...soft].map((item) => item.toLowerCase())
  );

  const uncategorized = skills.filter((skill) => !used.has(skill.toLowerCase()));

  return {
    technical: technical.length ? technical : uncategorized.slice(0, 6),
    tools,
    frameworks,
    soft
  };
}

function spokenLanguagesFromSkills(skills: string[]) {
  const spoken = [
    "english",
    "hindi",
    "spanish",
    "french",
    "german",
    "arabic",
    "urdu",
    "bengali",
    "tamil",
    "marathi",
    "punjabi"
  ];

  return skills.filter((skill) =>
    spoken.some((lang) => skill.toLowerCase().includes(lang))
  );
}

function formatDateRange(start: string, end: string) {
  const parts = [normalize(start), normalize(end)].filter(Boolean);
  return parts.join(" - ");
}

export function ResumePreview({
  resume,
  activeSection
}: {
  resume: ResumeInput;
  activeSection?: PreviewSectionKey | null;
}) {
  const basics = resume.content.basics;

  const fullName = normalize(basics.fullName) || normalize(resume.title) || "Resume";
  const email = normalize(basics.email);
  const phone = normalize(basics.phone);
  const location = normalize(basics.location);
  const linkedIn = normalize(basics.linkedin);
  const website = normalize(basics.website);
  const photoUrl = normalize(basics.photoUrl);
  const summary = normalize(resume.content.summary);
  const skills = dedupe(resume.content.skills.map(normalize).filter(Boolean));

  const workExperience = resume.content.workExperience
    .map((item) => {
      const title = normalize(item.title);
      const company = normalize(item.company);
      const startDate = normalize(item.startDate);
      const endDate = item.current ? "Present" : normalize(item.endDate);
      const bullets = item.bullets.map(normalize).filter(Boolean);
      const hasContent = Boolean(title || company || startDate || endDate || bullets.length);

      return hasContent
        ? {
            id: item.id,
            title,
            company,
            startDate,
            endDate,
            bullets
          }
        : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;

  const education = resume.content.education
    .map((item) => {
      const degree = normalize(item.degree);
      const institution = normalize(item.institution);
      const startDate = normalize(item.startDate);
      const endDate = normalize(item.endDate);

      if (!degree && !institution && !startDate && !endDate) {
        return null;
      }

      return {
        id: item.id,
        degree,
        institution,
        startDate,
        endDate
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
  }>;

  const projects = resume.content.projects
    .map((item) => {
      const name = normalize(item.name);
      const description = normalize(item.description);
      const link = normalize(item.link);
      const technologies = dedupe(item.technologies.map(normalize).filter(Boolean));
      const bullets = item.bullets.map(normalize).filter(Boolean);

      if (!name && !description && !link && !technologies.length && !bullets.length) {
        return null;
      }

      return {
        id: item.id,
        name,
        description,
        link,
        technologies,
        bullets
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    description: string;
    link: string;
    technologies: string[];
    bullets: string[];
  }>;

  const certifications = resume.content.certifications
    .map((item) => {
      const name = normalize(item.name);
      const issuer = normalize(item.issuer);
      const date = normalize(item.date);
      const link = normalize(item.link);

      if (!name && !issuer && !date && !link) {
        return null;
      }

      return {
        id: item.id,
        name,
        issuer,
        date,
        link
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    link: string;
  }>;

  const categorizedSkills = categorizeSkills(skills);

  const achievements = dedupe(
    workExperience
      .flatMap((item) => item.bullets)
      .filter((bullet) => /\d|improv|increas|reduc|launched|led|optimized|saved/i.test(bullet))
  ).slice(0, 5);

  const spokenLanguages = spokenLanguagesFromSkills(skills).slice(0, 5);

  const portfolioLinks = dedupe(
    [
      linkedIn,
      website,
      ...projects.map((item) => item.link),
      ...certifications.map((item) => item.link)
    ].filter(Boolean)
  );

  const hasPrimaryTimeline = workExperience.length > 0 || projects.length > 0;
  const activeCardTone =
    "border-brand-300 bg-brand-100/55 shadow-[0_0_0_2px_rgba(11,152,209,0.16),0_14px_28px_rgba(15,23,42,0.12)]";
  const cardClass = (keys: PreviewSectionKey[]) =>
    `resume-card ${activeSection && keys.includes(activeSection) ? activeCardTone : ""}`;

  const profileCard = (
    <aside className={`${cardClass(["basics", "summary"])} resume-card-hero`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Professional Profile
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.06] tracking-tight text-slate-900">{fullName}</h2>
          {normalize(resume.title) ? (
            <p className="text-[1.05rem] font-medium leading-6 text-slate-700">{normalize(resume.title)}</p>
          ) : null}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="h-16 w-16 rounded-xl border border-brand-100 object-cover"
            />
          ) : null}
          <span className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
            ATS-ready
          </span>
        </div>
      </div>
      {photoUrl ? (
        <div className="mt-3 sm:hidden">
          <img
            src={photoUrl}
            alt="Profile"
            className="h-16 w-16 rounded-xl border border-brand-100 object-cover"
          />
        </div>
      ) : null}
      {summary ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="resume-card-title">Summary</h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">{summary}</p>
        </div>
      ) : null}
    </aside>
  );

  const workExperienceCard = workExperience.length ? (
    <aside className={cardClass(["experience"])}>
      <h3 className="resume-card-title">Work Experience</h3>
      <div className="mt-3 space-y-4">
        {workExperience.map((item) => (
          <div key={item.id} className="resume-entry">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {[item.title, item.company].filter(Boolean).join(" | ")}
              </p>
              {item.startDate || item.endDate ? (
                <p className="text-xs font-medium text-slate-500">
                  {formatDateRange(item.startDate, item.endDate)}
                </p>
              ) : null}
            </div>
            {item.bullets.length ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {item.bullets.map((bullet, index) => (
                  <li key={`${item.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  ) : null;

  const projectsCard = projects.length ? (
    <aside className={cardClass(["projects"])}>
      <h3 className="resume-card-title">Projects</h3>
      <div className="mt-3 space-y-4">
        {projects.map((item) => (
          <div key={item.id} className="resume-entry">
            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
            {item.technologies.length ? (
              <p className="mt-1 text-xs text-slate-500">
                Tech Stack: {item.technologies.join(", ")}
              </p>
            ) : null}
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
            ) : null}
            {item.bullets.length ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {item.bullets.map((bullet, index) => (
                  <li key={`${item.id}-b-${index}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {item.link ? (
              <p className="mt-2 text-sm">
                <a href={item.link} className="link-brand" target="_blank" rel="noreferrer">
                  {item.link}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  ) : null;

  const contactCard = (email || phone || location || linkedIn || website) ? (
    <aside className={cardClass(["basics"])}>
      <h3 className="resume-card-title">Contact Information</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        {email ? (
          <p className="resume-contact-item">
            <Mail className="h-4 w-4 text-slate-500" aria-hidden />
            <span>{email}</span>
          </p>
        ) : null}
        {phone ? (
          <p className="resume-contact-item">
            <Phone className="h-4 w-4 text-slate-500" aria-hidden />
            <span>{phone}</span>
          </p>
        ) : null}
        {location ? (
          <p className="resume-contact-item">
            <MapPin className="h-4 w-4 text-slate-500" aria-hidden />
            <span>{location}</span>
          </p>
        ) : null}
        {linkedIn ? (
          <p className="resume-contact-item">
            <UserRound className="h-4 w-4 text-slate-500" aria-hidden />
            <span className="break-all">{linkedIn}</span>
          </p>
        ) : null}
        {website ? (
          <p className="resume-contact-item">
            <LinkIcon className="h-4 w-4 text-slate-500" aria-hidden />
            <span className="break-all">{website}</span>
          </p>
        ) : null}
      </div>
    </aside>
  ) : null;

  const skillsCard = skills.length ? (
    <aside className={cardClass(["skills"])}>
      <h3 className="resume-card-title">Skills</h3>
      <div className="mt-3 space-y-3">
        {categorizedSkills.technical.length ? (
          <div className="resume-subsection">
            <p className="resume-meta-title">Technical Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categorizedSkills.technical.slice(0, 8).map((skill) => (
                <span key={skill} className="resume-pill">{skill}</span>
              ))}
            </div>
          </div>
        ) : null}
        {categorizedSkills.tools.length ? (
          <div className="resume-subsection">
            <p className="resume-meta-title">Tools</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categorizedSkills.tools.slice(0, 6).map((skill) => (
                <span key={skill} className="resume-pill">{skill}</span>
              ))}
            </div>
          </div>
        ) : null}
        {categorizedSkills.frameworks.length ? (
          <div className="resume-subsection">
            <p className="resume-meta-title">Frameworks</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categorizedSkills.frameworks.slice(0, 6).map((skill) => (
                <span key={skill} className="resume-pill">{skill}</span>
              ))}
            </div>
          </div>
        ) : null}
        {categorizedSkills.soft.length ? (
          <div className="resume-subsection">
            <p className="resume-meta-title">Soft Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categorizedSkills.soft.slice(0, 6).map((skill) => (
                <span key={skill} className="resume-pill">{skill}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  ) : null;

  const educationCard = education.length ? (
    <aside className={cardClass(["education"])}>
      <h3 className="resume-card-title">Education</h3>
      <div className="mt-3 space-y-3">
        {education.map((item) => (
          <div key={item.id} className="resume-entry">
            <p className="text-sm font-semibold text-slate-900">
              {[item.degree, item.institution].filter(Boolean).join(" - ")}
            </p>
            {item.startDate || item.endDate ? (
              <p className="mt-1 text-xs text-slate-500">
                {formatDateRange(item.startDate, item.endDate)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  ) : null;

  const certificationsCard = certifications.length ? (
    <aside className={cardClass(["certifications"])}>
      <h3 className="resume-card-title">Certifications</h3>
      <div className="mt-3 space-y-3">
        {certifications.map((item) => (
          <div key={item.id} className="resume-entry">
            <p className="text-sm font-semibold text-slate-900">
              {[item.name, item.issuer].filter(Boolean).join(" - ")}
              {item.date ? ` (${item.date})` : ""}
            </p>
            {item.link ? (
              <p className="mt-1 text-sm">
                <a href={item.link} className="link-brand" target="_blank" rel="noreferrer">
                  {item.link}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  ) : null;

  const achievementsCard = achievements.length ? (
    <aside className={cardClass(["experience"])}>
      <h3 className="resume-card-title flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" aria-hidden />
        Achievements
      </h3>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {achievements.map((achievement) => (
          <li key={achievement}>{achievement}</li>
        ))}
      </ul>
    </aside>
  ) : null;

  const languagesCard = spokenLanguages.length ? (
    <aside className={cardClass(["skills"])}>
      <h3 className="resume-card-title flex items-center gap-2">
        <Languages className="h-4 w-4 text-slate-500" aria-hidden />
        Languages
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {spokenLanguages.map((language) => (
          <span key={language} className="resume-pill">{language}</span>
        ))}
      </div>
    </aside>
  ) : null;

  const portfolioCard = portfolioLinks.length ? (
    <aside className={cardClass(["projects", "certifications", "basics"])}>
      <h3 className="resume-card-title flex items-center gap-2">
        <BriefcaseBusiness className="h-4 w-4 text-slate-500" aria-hidden />
        Links / Portfolio
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {portfolioLinks.map((link) => (
          <li key={link} className="break-all">
            <a href={link} className="link-brand" target="_blank" rel="noreferrer">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  ) : null;

  return (
    <div className="paper-panel resume-preview-shell max-h-[78vh] overflow-auto p-4 sm:p-6 lg:p-7">
      {hasPrimaryTimeline ? (
        <div className="resume-preview-grid">
          <div className="space-y-4">
            {profileCard}
            {workExperienceCard}
            {projectsCard}
          </div>
          <div className="space-y-4">
            {contactCard}
            {skillsCard}
            {educationCard}
            {certificationsCard}
            {achievementsCard}
            {languagesCard}
            {portfolioCard}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {profileCard}
          {contactCard}
          {skillsCard}
          {educationCard}
          {certificationsCard}
          {achievementsCard}
          {languagesCard}
          {portfolioCard}
        </div>
      )}
    </div>
  );
}
