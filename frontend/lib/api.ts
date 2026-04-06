import { getAuthHeaders } from "@/lib/auth";
import type { MatchResult, ResumeInput, ResumeRecord } from "@/types/resume";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }

  const response = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  listResumes(): Promise<ResumeRecord[]> {
    return request<ResumeRecord[]>("/resumes");
  },
  getResume(id: string): Promise<ResumeRecord> {
    return request<ResumeRecord>(`/resumes/${id}`);
  },
  createResume(payload: ResumeInput): Promise<ResumeRecord> {
    return request<ResumeRecord>("/resumes", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateResume(id: string, payload: ResumeInput): Promise<ResumeRecord> {
    return request<ResumeRecord>(`/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  matchResume(id: string, jobDescription: string): Promise<MatchResult> {
    return request<MatchResult>(`/resumes/${id}/match`, {
      method: "POST",
      body: JSON.stringify({ job_description: jobDescription })
    });
  },
  exportUrl(id: string, format: "docx" | "pdf") {
    return `${API_BASE}${API_PREFIX}/resumes/${id}/export/${format}`;
  }
};
