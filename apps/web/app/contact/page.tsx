"use client";

import { FormEvent, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  subject: "",
  message: ""
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<"" | "success" | "error">("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }

    // Placeholder submit flow until backend contact endpoint is connected.
    console.info("Contact form submission (placeholder)", form);
    setStatus("success");
    setForm(INITIAL_FORM);
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="card p-6 sm:p-7">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
          Contact
        </span>
        <h1 className="page-title mt-3 text-3xl">Get in touch with ResumeForge support</h1>
        <p className="page-subtitle">
          Share account, editor, export, or ATS matching questions. We will route your message to the right team.
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="field-label" htmlFor="contact-name">
              Name
            </label>
            <input
              id="contact-name"
              className="input"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact-subject">
              Subject
            </label>
            <input
              id="contact-subject"
              className="input"
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
              placeholder="What can we help with?"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              className="textarea min-h-[160px]"
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Include enough detail so we can help quickly."
              required
            />
          </div>

          {status === "error" ? (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Please complete all fields before submitting.
            </p>
          ) : null}
          {status === "success" ? (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Message received. This form is in placeholder mode and ready for backend integration.
            </p>
          ) : null}

          <button type="submit" className="btn-primary">
            <Send className="h-4 w-4" aria-hidden />
            Send Message
          </button>
        </form>
      </div>

      <aside className="card h-fit space-y-4 p-6">
        <h2 className="section-title">Support Details</h2>
        <p className="text-sm leading-6 text-slate-600">
          For product issues, account help, or export troubleshooting, contact us below.
        </p>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
            <Mail className="h-4 w-4 text-brand-700" aria-hidden />
            support@resumeforge.app
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-slate-700">
            <MessageSquare className="h-4 w-4 text-brand-700" aria-hidden />
            Typical response time: within 1 business day
          </p>
        </div>
      </aside>
    </section>
  );
}
