"use client";

const TOKEN_KEY = "resumeforge_token";
const EMAIL_KEY = "resumeforge_email";
const USER_KEY = "resumeforge_user";
const FULL_NAME_KEY = "resumeforge_full_name";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(token: string, userId: string, email: string, fullName?: string | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userId);
  localStorage.setItem(EMAIL_KEY, email);
  if (fullName && fullName.trim()) {
    localStorage.setItem(FULL_NAME_KEY, fullName);
  } else {
    localStorage.removeItem(FULL_NAME_KEY);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(FULL_NAME_KEY);
}

export function readUser() {
  if (typeof window === "undefined") {
    return null;
  }
  const userId = localStorage.getItem(USER_KEY);
  const email = localStorage.getItem(EMAIL_KEY);
  const fullName = localStorage.getItem(FULL_NAME_KEY);
  if (!userId || !email) {
    return null;
  }
  return { userId, email, fullName };
}
