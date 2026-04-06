"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { ResumeInput } from "@resumeforge/shared";

import {
  createCertificationItem,
  createEducationItem,
  createProjectItem,
  createWorkItem
} from "@/lib/resume-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

interface ResumeEditorProps {
  value: ResumeInput;
  onChange: (next: ResumeInput) => void;
  sectionIds?: Partial<Record<"basics" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications", string>>;
  activeSection?: "basics" | "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | null;
}

function updateArrayItem<T>(items: T[], index: number, nextValue: T) {
  return items.map((item, idx) => (idx === index ? nextValue : item));
}

export function ResumeEditor({ value, onChange, sectionIds, activeSection }: ResumeEditorProps) {
  const resume = value;
  const content = resume.content;
  const [skillDraft, setSkillDraft] = useState("");

  function addSkillsFromText(raw: string) {
    const entries = raw
      .split(/[|\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!entries.length) {
      return;
    }

    const existing = new Set(content.skills.map((skill) => skill.toLowerCase()));
    const merged = [...content.skills];

    for (const entry of entries) {
      const normalized = entry.toLowerCase();
      if (!existing.has(normalized)) {
        merged.push(entry);
        existing.add(normalized);
      }
    }

    onChange({
      ...resume,
      content: {
        ...content,
        skills: merged
      }
    });
    setSkillDraft("");
  }

  function removeSkill(indexToRemove: number) {
    onChange({
      ...resume,
      content: {
        ...content,
        skills: content.skills.filter((_skill, index) => index !== indexToRemove)
      }
    });
  }

  function setPhotoUrl(nextPhotoUrl: string) {
    onChange({
      ...resume,
      content: {
        ...content,
        basics: { ...content.basics, photoUrl: nextPhotoUrl }
      }
    });
  }

  const basicsReady = Boolean(
    content.basics.fullName.trim() && content.basics.email.trim() && content.basics.phone.trim()
  );
  const summaryReady = content.summary.trim().length >= 45;
  const skillsReady = content.skills.length >= 5;
  const experienceReady = content.workExperience.length > 0;
  const educationReady = content.education.length > 0;

  return (
    <div className="space-y-5">
      <SectionCard
        sectionId={sectionIds?.basics}
        title="Resume Basics"
        description="Add complete recruiter contact details for ATS and hiring teams."
        badge={<StatusBadge label={basicsReady ? "Complete" : "Missing fields"} tone={basicsReady ? "success" : "warning"} />}
        defaultOpen
        active={activeSection === "basics"}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="field-label">Title</label>
            <input
              className="input"
              value={resume.title}
              onChange={(e) => onChange({ ...resume, title: e.target.value })}
            />
            <p className="field-help">Use a clear title, for example: Software Engineer Resume.</p>
          </div>
          <div>
            <label className="field-label">Full Name</label>
            <input
              className="input"
              value={content.basics.fullName}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: { ...content, basics: { ...content.basics, fullName: e.target.value } }
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              value={content.basics.email}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: { ...content, basics: { ...content.basics, email: e.target.value } }
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              className="input"
              value={content.basics.phone}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: { ...content, basics: { ...content.basics, phone: e.target.value } }
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Location</label>
            <input
              className="input"
              value={content.basics.location}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: { ...content, basics: { ...content.basics, location: e.target.value } }
                })
              }
            />
          </div>
          <div>
            <label className="field-label">LinkedIn</label>
            <input
              className="input"
              value={content.basics.linkedin}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: { ...content, basics: { ...content.basics, linkedin: e.target.value } }
                })
              }
            />
            <p className="field-help">Add your public profile URL for recruiter verification.</p>
          </div>
          <div className="md:col-span-2">
            <label className="field-label">Profile Photo (Optional)</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input min-w-[220px] flex-1"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={content.basics.photoUrl ?? ""}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <label className="btn-secondary cursor-pointer">
                <Plus className="h-4 w-4" aria-hidden />
                Upload Photo
                <input
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) {
                      return;
                    }
                    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setPhotoUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {content.basics.photoUrl ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPhotoUrl("")}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>
            <p className="field-help">Used in templates that support photo (for example, Modern Sidebar).</p>
            {content.basics.photoUrl ? (
              <div className="mt-2">
                <img
                  src={content.basics.photoUrl}
                  alt="Profile preview"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.summary}
        title="Professional Summary"
        description="2-3 lines focused on outcomes, domain strengths, and role alignment."
        badge={<StatusBadge label={summaryReady ? "Complete" : "Needs detail"} tone={summaryReady ? "success" : "warning"} />}
        active={activeSection === "summary"}
      >
        <textarea
          className="textarea min-h-[130px]"
          value={content.summary}
          onChange={(e) => onChange({ ...resume, content: { ...content, summary: e.target.value } })}
          placeholder="Write a concise summary aligned with target roles."
        />
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.skills}
        title="Skills"
        description="Use Enter to add one skill, or | to add multiple in one line."
        badge={<StatusBadge label={skillsReady ? "Strong" : "Add more"} tone={skillsReady ? "success" : "info"} />}
        active={activeSection === "skills"}
      >
        <input
          className="input"
          placeholder="Type a skill then press Enter, or add multiple with |"
          value={skillDraft}
          onChange={(e) => setSkillDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkillsFromText(skillDraft);
              return;
            }

            if (e.key === "|") {
              e.preventDefault();
              addSkillsFromText(skillDraft);
              return;
            }

            if (e.key === "Backspace" && !skillDraft && content.skills.length) {
              removeSkill(content.skills.length - 1);
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (!pasted) {
              return;
            }
            e.preventDefault();
            addSkillsFromText(pasted);
          }}
        />
        <p className="field-help">Space will not add skills. Use Enter or | only.</p>
        {content.skills.length ? (
          <div className="flex flex-wrap gap-2">
            {content.skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm text-brand-700"
              >
                {skill}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                  onClick={() => removeSkill(index)}
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No skills yet. Add role-relevant keywords used in job posts.</p>
        )}
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.experience}
        title="Work Experience"
        description="Focus on measurable outcomes, scope, and impact in each role."
        badge={<StatusBadge label={experienceReady ? "Added" : "Missing"} tone={experienceReady ? "success" : "warning"} />}
        active={activeSection === "experience"}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onChange({
                ...resume,
                content: { ...content, workExperience: [...content.workExperience, createWorkItem()] }
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Role
          </button>
        }
      >
        {content.workExperience.length === 0 ? (
          <EmptyState
            title="No work experience added"
            description="Add at least one role with measurable bullet points to improve ATS matching."
          />
        ) : null}
        {content.workExperience.map((item, index) => (
          <article key={item.id} className="rounded-lg border border-slate-200 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input"
                placeholder="Company"
                value={item.company}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      workExperience: updateArrayItem(content.workExperience, index, {
                        ...item,
                        company: e.target.value
                      })
                    }
                  })
                }
              />
              <input
                className="input"
                placeholder="Role title"
                value={item.title}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      workExperience: updateArrayItem(content.workExperience, index, {
                        ...item,
                        title: e.target.value
                      })
                    }
                  })
                }
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input
                className="input"
                placeholder="Start date"
                value={item.startDate}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      workExperience: updateArrayItem(content.workExperience, index, {
                        ...item,
                        startDate: e.target.value
                      })
                    }
                  })
                }
              />
              <input
                className="input"
                placeholder="End date"
                value={item.endDate}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      workExperience: updateArrayItem(content.workExperience, index, {
                        ...item,
                        endDate: e.target.value
                      })
                    }
                  })
                }
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={item.current}
                  onChange={(e) =>
                    onChange({
                      ...resume,
                      content: {
                        ...content,
                        workExperience: updateArrayItem(content.workExperience, index, {
                          ...item,
                          current: e.target.checked
                        })
                      }
                    })
                  }
                />
                Current role
              </label>
            </div>

            <div className="mt-3 space-y-2">
              {item.bullets.map((bullet, bulletIndex) => (
                <div key={`${item.id}-bullet-${bulletIndex}`} className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Impact bullet"
                    value={bullet}
                    onChange={(e) => {
                      const nextBullets = item.bullets.map((entry, entryIndex) =>
                        entryIndex === bulletIndex ? e.target.value : entry
                      );
                      onChange({
                        ...resume,
                        content: {
                          ...content,
                          workExperience: updateArrayItem(content.workExperience, index, {
                            ...item,
                            bullets: nextBullets
                          })
                        }
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const nextBullets = item.bullets.filter(
                        (_entry, entryIndex) => entryIndex !== bulletIndex
                      );
                      onChange({
                        ...resume,
                        content: {
                          ...content,
                          workExperience: updateArrayItem(content.workExperience, index, {
                            ...item,
                            bullets: nextBullets
                          })
                        }
                      });
                    }}
                    >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      workExperience: updateArrayItem(content.workExperience, index, {
                        ...item,
                        bullets: [...item.bullets, ""]
                      })
                    }
                  })
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Bullet
              </button>
            </div>

            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    workExperience: content.workExperience.filter(
                      (_entry, currentIndex) => currentIndex !== index
                    )
                  }
                })
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove Role
            </button>
          </article>
        ))}
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.education}
        title="Education"
        description="Keep degree and institution clear for ATS parsing."
        badge={<StatusBadge label={educationReady ? "Added" : "Missing"} tone={educationReady ? "success" : "warning"} />}
        active={activeSection === "education"}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onChange({
                ...resume,
                content: { ...content, education: [...content.education, createEducationItem()] }
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Education
          </button>
        }
      >
        {content.education.length === 0 ? (
          <p className="text-sm text-slate-500">Add at least one education entry.</p>
        ) : null}
        {content.education.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Institution"
              value={item.institution}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    education: updateArrayItem(content.education, index, {
                      ...item,
                      institution: e.target.value
                    })
                  }
                })
              }
            />
            <input
              className="input"
              placeholder="Degree"
              value={item.degree}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    education: updateArrayItem(content.education, index, {
                      ...item,
                      degree: e.target.value
                    })
                  }
                })
              }
            />
            <input
              className="input"
              placeholder="Start"
              value={item.startDate}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    education: updateArrayItem(content.education, index, {
                      ...item,
                      startDate: e.target.value
                    })
                  }
                })
              }
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="End"
                value={item.endDate}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      education: updateArrayItem(content.education, index, {
                        ...item,
                        endDate: e.target.value
                      })
                    }
                  })
                }
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      education: content.education.filter(
                        (_entry, currentIndex) => currentIndex !== index
                      )
                    }
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.projects}
        title="Projects"
        description="Optional but useful for demonstrating practical outcomes."
        defaultOpen={false}
        active={activeSection === "projects"}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onChange({
                ...resume,
                content: { ...content, projects: [...content.projects, createProjectItem()] }
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Project
          </button>
        }
      >
        {content.projects.length === 0 ? (
          <p className="text-sm text-slate-500">No projects yet. Add one to highlight practical achievements.</p>
        ) : null}
        {content.projects.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <input
              className="input"
              placeholder="Project name"
              value={item.name}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    projects: updateArrayItem(content.projects, index, { ...item, name: e.target.value })
                  }
                })
              }
            />
            <textarea
              className="textarea"
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    projects: updateArrayItem(content.projects, index, {
                      ...item,
                      description: e.target.value
                    })
                  }
                })
              }
              />
            <div>
              <label className="field-label">Project URL / Live Link</label>
              <input
                className="input"
                type="url"
                placeholder="https://github.com/username/project"
                value={item.link}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      projects: updateArrayItem(content.projects, index, {
                        ...item,
                        link: e.target.value
                      })
                    }
                  })
                }
              />
              <p className="field-help">Optional. Add GitHub, live demo, or portfolio link.</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    projects: content.projects.filter((_entry, currentIndex) => currentIndex !== index)
                  }
                })
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove Project
            </button>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        sectionId={sectionIds?.certifications}
        title="Certifications"
        description="Optional certifications can improve trust for specialized roles."
        defaultOpen={false}
        active={activeSection === "certifications"}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onChange({
                ...resume,
                content: {
                  ...content,
                  certifications: [...content.certifications, createCertificationItem()]
                }
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Certification
          </button>
        }
      >
        {content.certifications.length === 0 ? (
          <p className="text-sm text-slate-500">No certifications added.</p>
        ) : null}
        {content.certifications.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Certification name"
              value={item.name}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    certifications: updateArrayItem(content.certifications, index, {
                      ...item,
                      name: e.target.value
                    })
                  }
                })
              }
            />
            <input
              className="input"
              placeholder="Issuer"
              value={item.issuer}
              onChange={(e) =>
                onChange({
                  ...resume,
                  content: {
                    ...content,
                    certifications: updateArrayItem(content.certifications, index, {
                      ...item,
                      issuer: e.target.value
                    })
                  }
                })
              }
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Date"
                value={item.date}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      certifications: updateArrayItem(content.certifications, index, {
                        ...item,
                        date: e.target.value
                      })
                    }
                  })
                }
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      certifications: content.certifications.filter(
                        (_entry, currentIndex) => currentIndex !== index
                      )
                    }
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Certification URL / Credential Link</label>
              <input
                className="input"
                type="url"
                placeholder="https://credential.example.com/verify/123"
                value={item.link ?? ""}
                onChange={(e) =>
                  onChange({
                    ...resume,
                    content: {
                      ...content,
                      certifications: updateArrayItem(content.certifications, index, {
                        ...item,
                        link: e.target.value
                      })
                    }
                  })
                }
              />
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
