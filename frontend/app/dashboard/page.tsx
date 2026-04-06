"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ResumeRecord } from "@/types/resume";

export default function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.listResumes();
        if (!cancelled) {
          setResumes(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load resumes.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stack">
      <h1 className="page-title">Dashboard</h1>
      <p className="muted">Manage your resumes and jump into tailoring workflows.</p>

      <div className="row">
        <Link href="/resume/new" className="button">
          Create Resume
        </Link>
      </div>

      {loading ? <div className="card">Loading resumes...</div> : null}
      {error ? <div className="status error">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid two">
          {resumes.length === 0 ? (
            <div className="card">No resumes yet. Create your first one.</div>
          ) : (
            resumes.map((resume) => (
              <article key={resume.id} className="card stack">
                <h3 style={{ margin: 0 }}>{resume.title}</h3>
                <div className="muted">{resume.content.full_name || "Untitled Candidate"}</div>
                <div className="row">
                  <Link href={`/resume/${resume.id}/edit`} className="button secondary">
                    Edit
                  </Link>
                  <Link href={`/resume/${resume.id}/match`} className="button secondary">
                    Match
                  </Link>
                  <Link href={`/resume/${resume.id}/preview`} className="button">
                    Preview
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
