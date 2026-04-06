const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect account information you provide directly, such as full name, email address, and password credentials.",
      "We also store resume content that you create in the editor, including profile details, experience, education, skills, projects, and certifications."
    ]
  },
  {
    title: "2. Account and Authentication Data",
    body: [
      "Passwords are stored in hashed form and are not saved as plaintext.",
      "For security and troubleshooting, login-related event data may be recorded, such as login timestamp, IP address, and user-agent information."
    ]
  },
  {
    title: "3. Resume and Profile Content",
    body: [
      "Resume data is used to provide editing, AI suggestions, keyword matching, scoring, and export functionality.",
      "You are responsible for ensuring the information you enter is accurate and appropriate for your job applications."
    ]
  },
  {
    title: "4. Cookies and Analytics",
    body: [
      "The application uses essential browser storage and cookies to keep sign-in, security checks, and core app functionality working.",
      "A cookie consent banner lets users choose essential-only cookies or allow analytics cookies used for product improvement."
    ]
  },
  {
    title: "5. How We Use Data",
    body: [
      "We use your data to operate core product features, secure accounts, improve reliability, and support resume-building workflows.",
      "We do not intentionally use your resume content for unrelated advertising purposes in this placeholder policy."
    ]
  },
  {
    title: "6. Data Sharing",
    body: [
      "Data may be processed by infrastructure or service providers required to run the application.",
      "This placeholder policy does not claim any specific legal framework or third-party contract terms."
    ]
  },
  {
    title: "7. Data Retention",
    body: [
      "Account and resume data is retained while your account is active, unless removed by administrators or user-requested deletion workflows.",
      "Retention periods can vary by deployment environment and operational requirements."
    ]
  },
  {
    title: "8. Security",
    body: [
      "We apply reasonable technical safeguards, including password hashing and authenticated API access.",
      "No system is perfectly secure, so you should avoid including highly sensitive personal identifiers unless required."
    ]
  },
  {
    title: "9. Your Rights and Choices",
    body: [
      "Depending on your jurisdiction and deployment context, you may request access, correction, or deletion of personal data.",
      "Contact the application owner or administrator for data requests and account-related support."
    ]
  },
  {
    title: "10. Contact",
    body: [
      "For privacy-related questions, contact your ResumeForge administrator or support channel for this deployment.",
      "This page is a professional placeholder policy and should be reviewed by legal counsel before production legal use."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="card p-6 sm:p-7">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
          Legal
        </span>
        <h1 className="page-title mt-3 text-3xl">Privacy Policy</h1>
        <p className="page-subtitle">
          Last updated: March 22, 2026. This is a structured placeholder policy for ResumeForge deployments.
        </p>
      </header>

      <article className="card space-y-4 p-4 sm:p-6">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="section-title text-xl">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-6 text-slate-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </section>
  );
}
