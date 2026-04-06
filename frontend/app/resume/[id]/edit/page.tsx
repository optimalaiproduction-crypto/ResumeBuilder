"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResumeForm } from "@/components/resume-form";
import { api } from "@/lib/api";
import type { ResumeInput, ResumeRecord } from "@/types/resume";

interface EditResumePageProps {
  params: { id: string };
}

export default function EditResumePage({ params }: EditResumePageProps) {
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

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
          setError(err instanceof Error ? err.message : "Unable to load resume.");
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

  async function handleUpdate(payload: ResumeInput) {
    setSaving(true);
    try {
      const updated = await api.updateResume(params.id, payload);
      setResume(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <h1 className="page-title">Edit Resume</h1>
      <div className="row">
        <Link href={`/resume/${params.id}/match`} className="button secondary">
          Match to Job
        </Link>
        <Link href={`/resume/${params.id}/preview`} className="button">
          Preview
        </Link>
      </div>

      {loading ? <div className="card">Loading resume...</div> : null}
      {error ? <div className="status error">{error}</div> : null}
      {!loading && resume ? (
        <ResumeForm initialValue={resume} submitLabel="Save Changes" busy={saving} onSubmit={handleUpdate} />
      ) : null}
    </section>
  );
}
