"use client";

export type CookieConsentChoice = "essential" | "all";

const CONSENT_COOKIE_NAME = "resumeforge_cookie_consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function safeDocumentCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  return document.cookie ?? "";
}

function parseCookies(raw: string) {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const [name, ...valueParts] = entry.split("=");
      if (!name) {
        return acc;
      }
      acc[decodeURIComponent(name)] = decodeURIComponent(valueParts.join("=") ?? "");
      return acc;
    }, {});
}

function isConsentValue(value: string): value is CookieConsentChoice {
  return value === "essential" || value === "all";
}

export function readCookieConsent(): CookieConsentChoice | null {
  const cookies = parseCookies(safeDocumentCookie());
  const current = cookies[CONSENT_COOKIE_NAME];
  if (!current) {
    return null;
  }
  return isConsentValue(current) ? current : null;
}

export function saveCookieConsent(choice: CookieConsentChoice) {
  if (typeof document === "undefined") {
    return;
  }
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(CONSENT_COOKIE_NAME)}=${encodeURIComponent(choice)}` +
    `; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function canUseAnalyticsFromConsent(choice: CookieConsentChoice | null) {
  return choice === "all";
}
