import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .default("")
  .refine(
    (value) => !value || /^https?:\/\/\S+/i.test(value),
    "Enter a valid URL starting with http:// or https://"
  );

const optionalPhotoSchema = z
  .string()
  .trim()
  .default("")
  .refine(
    (value) => !value || /^https?:\/\/\S+/i.test(value) || value.startsWith("data:image/"),
    "Enter a valid image URL or upload an image file"
  );

export const basicsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  website: z.string().default(""),
  photoUrl: optionalPhotoSchema
});

export const workItemSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().min(1)).default([])
});

export const educationItemSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  startDate: z.string().default(""),
  endDate: z.string().default("")
});

export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().default(""),
  link: optionalUrlSchema,
  technologies: z.array(z.string().min(1)).default([]),
  bullets: z.array(z.string().min(1)).default([])
});

export const certificationItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().default(""),
  date: z.string().default(""),
  link: optionalUrlSchema
});

export const resumeContentSchema = z.object({
  basics: basicsSchema,
  summary: z.string().default(""),
  workExperience: z.array(workItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(z.string().min(1)).default([]),
  projects: z.array(projectItemSchema).default([]),
  certifications: z.array(certificationItemSchema).default([])
});

export const resumeSchema = z.object({
  title: z.string().min(2, "Title should be at least 2 characters"),
  content: resumeContentSchema
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;

export function createId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyResume(): ResumeInput {
  return {
    title: "Untitled Resume",
    content: {
      basics: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        photoUrl: ""
      },
      summary: "",
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: []
    }
  };
}

function normalizeStarterEmail(email?: string) {
  const normalized = email?.trim();
  if (normalized && normalized.includes("@")) {
    return normalized;
  }
  return "candidate@example.com";
}

export function createStarterResume(email?: string): ResumeInput {
  return {
    title: "Untitled Resume",
    content: {
      basics: {
        fullName: "Your Name",
        email: normalizeStarterEmail(email),
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        photoUrl: ""
      },
      summary: "",
      workExperience: [],
      education: [],
      skills: [
        "Communication",
        "Problem Solving",
        "Team Collaboration",
        "Time Management",
        "Microsoft Excel",
        "HTML",
        "CSS",
        "JavaScript"
      ],
      projects: [],
      certifications: []
    }
  };
}
