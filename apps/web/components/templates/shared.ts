import type { ResumeContent } from "@resumeforge/shared";

export type ResumeTemplateData = {
  title: string;
  content: ResumeContent;
};

export function text(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function dateRange(start: string, end: string) {
  return [text(start), text(end)].filter(Boolean).join(" - ");
}

export function contactLine(content: ResumeContent) {
  return [
    text(content.basics.email),
    text(content.basics.phone),
    text(content.basics.location),
    text(content.basics.linkedin),
    text(content.basics.website)
  ].filter(Boolean);
}
