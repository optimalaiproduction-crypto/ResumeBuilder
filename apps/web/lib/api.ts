import { API_BASE_URL } from "@/lib/constants";
import type {
  AIProviderStatusResponse,
  ExportRequest,
  KeywordResponse,
  ResumeTemplateOption,
  ResumeRecord,
  RewriteBulletResponse,
  RewriteSummaryResponse,
  ScoreResponse
} from "@/types/api";
import type { ResumeContent, ResumeInput } from "@resumeforge/shared";

function apiBases() {
  const bases = [API_BASE_URL];
  if (API_BASE_URL.includes("localhost")) {
    bases.push(API_BASE_URL.replace("localhost", "127.0.0.1"));
  }
  if (API_BASE_URL.includes("127.0.0.1")) {
    bases.push(API_BASE_URL.replace("127.0.0.1", "localhost"));
  }
  return [...new Set(bases)];
}

function isNetworkError(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return message.includes("failed to fetch") || message.includes("fetch failed");
}

function networkHint() {
  return "Unable to connect right now. Please try again.";
}

function parseApiError(text: string, status: number) {
  if (!text) {
    return `Request failed: ${status}`;
  }

  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    if (Array.isArray(parsed.detail)) {
      const messages = parsed.detail
        .map((issue) => {
          if (typeof issue === "object" && issue && "msg" in issue) {
            return String((issue as { msg?: unknown }).msg);
          }
          return null;
        })
        .filter(Boolean);
      if (messages.length) {
        return messages.join(" ");
      }
    }
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Fall back to raw response text if it is not JSON.
  }

  return text;
}

function isAuthTokenErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid authentication token") ||
    normalized.includes("could not validate credentials") ||
    normalized.includes("not authenticated") ||
    normalized.includes("token has expired") ||
    normalized.includes("invalid token subject")
  );
}

function notifyInvalidAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("resumeforge:auth-invalid"));
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Unexpected server response. Please try again.");
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let lastNetworkError: unknown = null;
  for (const base of apiBases()) {
    try {
      const response = await fetch(`${base}${path}`, {
        ...init,
        headers
      });
      if (!response.ok) {
        const text = await response.text();
        const message = parseApiError(text, response.status);
        if (response.status === 401 && isAuthTokenErrorMessage(message)) {
          notifyInvalidAuthToken();
        }
        throw new Error(message);
      }
      return parseResponseBody<T>(response);
    } catch (err) {
      if (isNetworkError(err)) {
        lastNetworkError = err;
        continue;
      }
      throw err;
    }
  }

  const reason = lastNetworkError instanceof Error ? lastNetworkError.message : "Failed to fetch";
  throw new Error(`${reason}. ${networkHint()}`);
}

export const api = {
  createResume(payload: ResumeInput, token: string) {
    return request<ResumeRecord>("/resumes", { method: "POST", body: JSON.stringify(payload) }, token);
  },
  listResumes(token: string) {
    return request<{ items: ResumeRecord[] }>("/resumes", { method: "GET" }, token);
  },
  getResume(id: string, token: string) {
    return request<ResumeRecord>(`/resumes/${id}`, { method: "GET" }, token);
  },
  updateResume(id: string, payload: ResumeInput, token: string) {
    return request<ResumeRecord>(`/resumes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
  },
  deleteResume(id: string, token: string) {
    return request<void>(`/resumes/${id}`, { method: "DELETE" }, token);
  },
  duplicateResume(id: string, token: string) {
    return request<ResumeRecord>(`/resumes/${id}/duplicate`, { method: "POST" }, token);
  },
  extractKeywords(jobDescription: string, token: string) {
    return request<KeywordResponse>(
      "/ai/extract-keywords",
      { method: "POST", body: JSON.stringify({ jobDescription }) },
      token
    );
  },
  rewriteSummary(resume: ResumeContent, jobDescription: string, token: string) {
    return request<RewriteSummaryResponse>(
      "/ai/rewrite-summary",
      { method: "POST", body: JSON.stringify({ resume, jobDescription }) },
      token
    );
  },
  rewriteBullet(bullet: string, jobDescription: string, roleContext: string, token: string) {
    return request<RewriteBulletResponse>(
      "/ai/rewrite-bullet",
      { method: "POST", body: JSON.stringify({ bullet, jobDescription, roleContext }) },
      token
    );
  },
  scoreResume(resume: ResumeContent, jobDescription: string, token: string, resumeId?: string) {
    return request<ScoreResponse>(
      "/ai/score-resume",
      { method: "POST", body: JSON.stringify({ resume, jobDescription, resumeId }) },
      token
    );
  },
  providerStatus(token: string) {
    return request<AIProviderStatusResponse>("/ai/providers/status", { method: "GET" }, token);
  },
  listTemplates() {
    return request<ResumeTemplateOption[]>("/templates", { method: "GET" });
  },
  async exportResume(format: "docx" | "pdf", payload: ExportRequest, token: string) {
    let lastNetworkError: unknown = null;
    for (const base of apiBases()) {
      try {
        const response = await fetch(`${base}/export/${format}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const message = parseApiError(await response.text(), response.status);
          if (response.status === 401 && isAuthTokenErrorMessage(message)) {
            notifyInvalidAuthToken();
          }
          throw new Error(message);
        }
        return response.blob();
      } catch (err) {
        if (isNetworkError(err)) {
          lastNetworkError = err;
          continue;
        }
        throw err;
      }
    }
    const reason = lastNetworkError instanceof Error ? lastNetworkError.message : "Failed to fetch";
    throw new Error(`${reason}. ${networkHint()}`);
  }
};
