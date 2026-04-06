"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MatchResult } from "@/types/resume";

interface MatchPageProps {
  params: { id: string };
}

export default function MatchPage({ params }: MatchPageProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function runMatch() {
    setBusy(true);
    setError("");
    try {
      const match = await api.matchResume(params.id, jobDescription);
      setResult(match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h1 className="page-title">Job Match</h1>
      <p className="muted">Paste a job description to get tailored improvement suggestions.</p>
      <div className="row">
        <Link href={`/resume/${params.id}/edit`} className="button secondary">
          Back to Edit
        </Link>
        <Link href={`/resume/${params.id}/preview`} className="button">
          Open Preview
        </Link>
      </div>

      <div className="card stack">
        <label className="field">
          <span>Job Description</span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the full role description here..."
            style={{ minHeight: 220 }}
          />
        </label>
        <div>
          <button
            className="button"
            onClick={runMatch}
            disabled={busy || jobDescription.trim().length < 20}
          >
            {busy ? "Matching..." : "Run AI Match"}
          </button>
        </div>
      </div>

      {error ? <div className="status error">{error}</div> : null}

      {result ? (
        <article className="card stack">
          <div className="row">
            <h3 style={{ margin: 0 }}>Match Score: {result.score}%</h3>
            <span className="chip">Provider: {result.provider_used}</span>
          </div>
          <ul className="list">
            {result.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
