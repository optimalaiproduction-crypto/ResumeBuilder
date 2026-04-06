import type { Metadata } from "next";
import "./globals.css";

import { ChunkRecovery } from "@/components/chunk-recovery";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "ResumeForge",
  description: "ATS-friendly resume builder powered by AI."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-grid">
        <ChunkRecovery />
        <AuthProvider>
          <TopNav />
          <main className="site-shell py-8">{children}</main>
          <CookieConsentBanner />
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
