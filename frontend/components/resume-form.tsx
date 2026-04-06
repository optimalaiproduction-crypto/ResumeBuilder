"use client";

import { useMemo, useState } from "react";
import type { ResumeInput, ResumeRecord } from "@/types/resume";

interface ResumeFormProps {
  initialValue?: ResumeRecord;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (payload: ResumeInput) => Promise<void>;
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function ResumeForm({ initialValue, submitLabel, onSubmit, busy = false }: ResumeFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "My Resume");
  const [fullName, setFullName] = useState(initialValue?.content.full_name ?? "");
  const [email, setEmail] = useState(initialValue?.content.email ?? "");
  const [phone, setPhone] = useState(initialValue?.content.phone ?? "");
  const [summary, setSummary] = useState(initialValue?.content.summary ?? "");
  const [skills, setSkills] = useState((initialValue?.content.skills ?? []).join(", "));
  const [experience, setExperience] = useState(
    joinLines(initialValue?.content.experience ?? [])
  );
  const [education, setEducation] = useState(joinLines(initialValue?.content.education ?? []));
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => fullName.trim().length > 1 && email.trim().length > 3, [
    fullName,
    email
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      await onSubmit({
        title,
        content: {
          full_name: fullName,
          email,
          phone,
          summary,
          skills: splitComma(skills),
          experience: splitLines(experience),
          education: splitLines(education)
        }
      });
      setStatus("Saved successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save resume.";
      setError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      {status ? <div className="status">{status}</div> : null}
      {error ? <div className="status error">{error}</div> : null}

      <div className="card grid">
        <label className="field">
          <span>Resume Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="field">
          <span>Full Name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Doe"
          />
        </label>

        <div className="grid two">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 111 222 3333"
            />
          </label>
        </div>

        <label className="field">
          <span>Professional Summary</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="2-3 sentences about your experience and impact."
          />
        </label>

        <label className="field">
          <span>Skills (comma-separated)</span>
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Python, FastAPI, PostgreSQL, Product Strategy"
          />
        </label>

        <label className="field">
          <span>Experience (one line per point)</span>
          <textarea
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            placeholder="Senior Engineer at Acme..."
          />
        </label>

        <label className="field">
          <span>Education (one line per point)</span>
          <textarea
            value={education}
            onChange={(event) => setEducation(event.target.value)}
            placeholder="B.S. Computer Science, Example University"
          />
        </label>

        <div className="row">
          <button type="submit" disabled={!canSubmit || busy} className="button">
            {busy ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
