"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResumeForm } from "@/components/resume-form";
import { api } from "@/lib/api";
import type { ResumeInput } from "@/types/resume";

export default function NewResumePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleCreate(payload: ResumeInput) {
    setBusy(true);
    try {
      const created = await api.createResume(payload);
      router.push(`/resume/${created.id}/edit`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h1 className="page-title">Create Resume</h1>
      <p className="muted">Start from scratch and save your first version.</p>
      <ResumeForm submitLabel="Create Resume" onSubmit={handleCreate} busy={busy} />
    </section>
  );
}
