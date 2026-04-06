"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ResumeRecord } from "@/types/resume";

interface PreviewPageProps {
  params: { id: string };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getResume(params.id);
        if (!cancelled) {
          setResume(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load preview.");
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
  }, [params.id]);

  return (
    <section className="stack">
      <h1 className="page-title">Resume Preview & Export</h1>
      <div className="row">
        <Link href={`/resume/${params.id}/edit`} className="button secondary">
          Edit
        </Link>
        <Link href={`/resume/${params.id}/match`} className="button secondary">
          Match
        </Link>
        <a className="button" href={api.exportUrl(params.id, "docx")} target="_blank">
          Export DOCX
        </a>
        <a className="button" href={api.exportUrl(params.id, "pdf")} target="_blank">
          Export PDF
        </a>
      </div>

      {loading ? <div className="card">Loading preview...</div> : null}
      {error ? <div className="status error">{error}</div> : null}

      {resume ? (
        <article className="card stack">
          <h2 style={{ margin: 0 }}>{resume.content.full_name || "Unnamed Candidate"}</h2>
          <div className="muted">
            {resume.content.email} {resume.content.phone ? `| ${resume.content.phone}` : ""}
          </div>

          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Summary</h3>
            <p>{resume.content.summary || "No summary provided yet."}</p>
          </section>

          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Skills</h3>
            <div className="row">
              {resume.content.skills.length === 0
                ? "No skills yet."
                : resume.content.skills.map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
            </div>
          </section>

          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Experience</h3>
            <ul className="list">
              {resume.content.experience.length === 0 ? (
                <li>No experience entries yet.</li>
              ) : (
                resume.content.experience.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>

          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Education</h3>
            <ul className="list">
              {resume.content.education.length === 0 ? (
                <li>No education entries yet.</li>
              ) : (
                resume.content.education.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>
        </article>
      ) : null}
    </section>
  );
}
