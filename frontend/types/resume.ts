export interface ResumeContent {
  full_name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
}

export interface ResumeInput {
  title: string;
  content: ResumeContent;
}

export interface ResumeRecord extends ResumeInput {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  score: number;
  provider_used: string;
  suggestions: string[];
}
