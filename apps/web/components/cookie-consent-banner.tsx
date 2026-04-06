"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentChoice
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    setIsVisible(existing === null);
    setIsReady(true);
  }, []);

  function handleChoice(choice: CookieConsentChoice) {
    saveCookieConsent(choice);
    setIsVisible(false);
    window.dispatchEvent(new Event("resumeforge:cookie-consent-changed"));
  }

  if (!isReady || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[70] px-4">
      <section className="cookie-banner mx-auto max-w-4xl rounded-2xl border bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.22)] sm:p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
            Cookie Settings
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            We use essential cookies to keep your account secure
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Essential cookies keep sign-in and app security working. You can also allow analytics
            cookies to help improve ResumeForge performance and experience.
          </p>
          <p className="text-xs text-slate-500">
            Learn more in our{" "}
            <Link href="/privacy" className="link-brand">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleChoice("essential")}
          >
            Essential Only
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleChoice("all")}
          >
            Accept All Cookies
          </button>
        </div>
      </section>
    </div>
  );
}
