import type { ResumeContent, ResumeInput } from "@resumeforge/shared";

export type ResumeRecord = ResumeInput & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string | null;
  user: UserProfile;
};

export type ForgotPasswordResponse = {
  message: string;
  dev_reset_token?: string | null;
};

export type ResetPasswordResponse = {
  message: string;
};

export type KeywordResponse = {
  keywords: string[];
  provider?: string;
  providerMessage?: string | null;
};

export type RewriteSummaryResponse = {
  originalSummary: string;
  rewrittenSummary: string;
  notes: string[];
  provider?: string;
  providerMessage?: string | null;
};

export type RewriteBulletResponse = {
  originalBullet: string;
  rewrittenBullet: string;
  notes: string[];
  provider?: string;
  providerMessage?: string | null;
};

export type ScoreResponse = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  provider?: string;
  providerMessage?: string | null;
};

export type AIProviderStatus = {
  provider: "openai" | "anthropic" | "ollama" | "fallback" | string;
  configured: boolean;
  available: boolean;
  healthy: boolean;
  model?: string | null;
  baseUrl?: string | null;
  detail?: string | null;
};

export type AIProviderStatusResponse = {
  mode: string;
  chain: string[];
  providers: AIProviderStatus[];
};

export type ExportRequest = {
  resumeId?: string;
  title?: string;
  content?: ResumeContent;
  resumeData?: {
    title: string;
    content: ResumeContent;
  };
  templateId?: string;
  method?: "server";
  pdfEngine?: "auto" | "weasyprint" | "reportlab";
};

export type ResumeTemplateOption = {
  id: string;
  name: string;
  category: string;
  supports_photo: boolean;
  columns: number;
  ats_friendly: boolean;
  ats_score: number;
};
