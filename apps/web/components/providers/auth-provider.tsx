"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { clearAuth, getAuthToken, readUser, saveAuth } from "@/lib/auth-store";
import { canUseAnalyticsFromConsent, readCookieConsent } from "@/lib/cookie-consent";
import { initFirebaseAnalytics } from "@/lib/firebase";

type AuthState = {
  isReady: boolean;
  token: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  setSession: (token: string, userId: string, email: string, fullName?: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const analyticsInitAttempted = useRef(false);

  useEffect(() => {
    const maybeInitAnalytics = () => {
      if (analyticsInitAttempted.current) {
        return;
      }
      const consent = readCookieConsent();
      if (!canUseAnalyticsFromConsent(consent)) {
        return;
      }
      analyticsInitAttempted.current = true;
      initFirebaseAnalytics().catch(() => {
        analyticsInitAttempted.current = false;
      });
    };

    maybeInitAnalytics();
    const handleCookieConsentChanged = () => maybeInitAnalytics();
    window.addEventListener("resumeforge:cookie-consent-changed", handleCookieConsentChanged);

    setToken(getAuthToken());
    const user = readUser();
    if (user) {
      setUserId(user.userId);
      setEmail(user.email);
      setFullName(user.fullName ?? null);
    }
    setIsReady(true);

    return () => {
      window.removeEventListener(
        "resumeforge:cookie-consent-changed",
        handleCookieConsentChanged
      );
    };
  }, []);

  useEffect(() => {
    const handleInvalidAuth = () => {
      clearAuth();
      setToken(null);
      setUserId(null);
      setEmail(null);
      setFullName(null);
    };

    window.addEventListener("resumeforge:auth-invalid", handleInvalidAuth);
    return () => window.removeEventListener("resumeforge:auth-invalid", handleInvalidAuth);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isReady,
      token,
      userId,
      email,
      fullName,
      setSession: (nextToken: string, nextUserId: string, nextEmail: string, nextFullName?: string | null) => {
        saveAuth(nextToken, nextUserId, nextEmail, nextFullName);
        setToken(nextToken);
        setUserId(nextUserId);
        setEmail(nextEmail);
        setFullName(nextFullName ?? null);
      },
      logout: () => {
        clearAuth();
        setToken(null);
        setUserId(null);
        setEmail(null);
        setFullName(null);
      }
    }),
    [isReady, token, userId, email, fullName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
