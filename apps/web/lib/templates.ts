import type { ComponentType } from "react";

import { ATSClassicTemplate } from "@/components/templates/ATSClassicTemplate";
import { ExecutiveCleanTemplate } from "@/components/templates/ExecutiveCleanTemplate";
import { ModernSidebarTemplate } from "@/components/templates/ModernSidebarTemplate";
import type { ResumeContent } from "@resumeforge/shared";

export type TemplateId = "ats_classic" | "modern_sidebar" | "executive_clean";

export type TemplateData = {
  title: string;
  content: ResumeContent;
};

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  category: string;
  supports_photo: boolean;
  columns: number;
  ats_friendly: boolean;
  ats_score: number;
};

export type TemplateComponent = ComponentType<{ data: TemplateData }>;

export const templates: Record<TemplateId, TemplateComponent> = {
  ats_classic: ATSClassicTemplate,
  modern_sidebar: ModernSidebarTemplate,
  executive_clean: ExecutiveCleanTemplate
};

export const templateCatalog: TemplateMeta[] = [
  {
    id: "ats_classic",
    name: "ATS Classic",
    category: "ats",
    supports_photo: false,
    columns: 1,
    ats_friendly: true,
    ats_score: 96
  },
  {
    id: "modern_sidebar",
    name: "Modern Sidebar",
    category: "modern",
    supports_photo: true,
    columns: 2,
    ats_friendly: true,
    ats_score: 86
  },
  {
    id: "executive_clean",
    name: "Executive Clean",
    category: "executive",
    supports_photo: false,
    columns: 1,
    ats_friendly: true,
    ats_score: 90
  }
];
