import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="stack" style={{ paddingTop: "1.5rem" }}>
      <div className="surface stack">
        <span className="chip">Next.js + FastAPI + PostgreSQL</span>
        <h1 className="page-title">Build tailored resumes in minutes.</h1>
        <p className="muted">
          Create, edit, and match your resume to a job description. Export to DOCX or PDF with
          one click.
        </p>
        <div className="row">
          <Link href="/resume/new" className="button">
            Start New Resume
          </Link>
          <Link href="/dashboard" className="button secondary">
            Open Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
