import type { ResumeInput } from "@resumeforge/shared";

import type { ProgressStep } from "@/components/ui/progress-stepper";

function totalBullets(resume: ResumeInput) {
  return resume.content.workExperience.reduce((count, item) => count + item.bullets.filter(Boolean).length, 0);
}

function hasMeasuredImpact(resume: ResumeInput) {
  const bulletText = resume.content.workExperience.flatMap((item) => item.bullets);
  return bulletText.some((bullet) => /\d/.test(bullet));
}

export function getCompletionPercent(resume: ResumeInput) {
  const checks = [
    Boolean(resume.content.basics.fullName.trim()),
    Boolean(resume.content.basics.email.trim()),
    Boolean(resume.content.basics.phone.trim()),
    Boolean(resume.content.basics.linkedin.trim()),
    resume.content.summary.trim().length >= 45,
    resume.content.skills.length >= 5,
    resume.content.workExperience.length > 0,
    totalBullets(resume) >= 3,
    resume.content.education.length > 0
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function getSectionHealthIssues(resume: ResumeInput) {
  const issues: string[] = [];

  if (!resume.content.basics.phone.trim()) {
    issues.push("Missing phone number");
  }
  if (!resume.content.basics.linkedin.trim()) {
    issues.push("Missing LinkedIn profile");
  }
  if (resume.content.education.length === 0) {
    issues.push("Missing education details");
  }
  if (!hasMeasuredImpact(resume)) {
    issues.push("No measurable achievements yet");
  }
  if (resume.content.skills.length < 5) {
    issues.push("Add at least 5 role-relevant skills");
  }

  return issues;
}

export function getEditorWorkflowSteps(
  resume: ResumeInput,
  resumeId: string,
  options?: {
    matchCompleted?: boolean;
  }
): ProgressStep[] {
  const basicsComplete = Boolean(
    resume.content.basics.fullName.trim() &&
      resume.content.basics.email.trim() &&
      resume.content.basics.phone.trim()
  );
  const experienceComplete = resume.content.workExperience.length > 0 && totalBullets(resume) >= 2;
  const educationComplete = resume.content.education.length > 0;
  const skillsComplete = resume.content.skills.length >= 5;
  const matchComplete = Boolean(options?.matchCompleted);

  return [
    { id: "basics", label: "Basics", completed: basicsComplete, targetId: "resume-basics" },
    { id: "experience", label: "Experience", completed: experienceComplete, targetId: "resume-experience" },
    { id: "education", label: "Education", completed: educationComplete, targetId: "resume-education" },
    { id: "skills", label: "Skills", completed: skillsComplete, targetId: "resume-skills" },
    { id: "match", label: "Match", completed: matchComplete, href: `/resume/${resumeId}/match`, targetId: "resume-match" },
    { id: "export", label: "Export", completed: false, href: `/resume/${resumeId}/preview`, targetId: "resume-export" }
  ];
}

export function getResumeStatus(completion: number) {
  if (completion >= 85) {
    return { label: "Ready", tone: "success" as const };
  }
  if (completion >= 60) {
    return { label: "In progress", tone: "info" as const };
  }
  return { label: "Needs details", tone: "warning" as const };
}
