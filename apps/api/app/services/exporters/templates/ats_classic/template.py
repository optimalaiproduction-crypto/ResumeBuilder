from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.exporters.templates.shared import (
  read_css,
  render_certifications,
  render_document,
  render_education,
  render_experience,
  render_header,
  render_projects,
  render_skills,
  render_summary,
)

metadata = {
  "id": "ats_classic",
  "name": "ATS Classic",
  "category": "ats",
  "supports_photo": False,
  "columns": 1,
  "ats_friendly": True,
  "ats_score": 96,
  "aliases": ("ats",),
}


def render(resume: dict[str, Any]) -> str:
  css = read_css(Path(__file__).with_name("styles.css"))

  sections = [
    render_header(resume, class_name="rf-header rf-header-ats", contact_separator=" | "),
    render_summary(resume, heading="Summary"),
    render_experience(resume, heading="Experience"),
    render_education(resume, heading="Education"),
    render_skills(resume, heading="Skills"),
    render_projects(resume, heading="Projects"),
    render_certifications(resume, heading="Certifications"),
  ]
  body = "".join([section for section in sections if section])

  return render_document(
    title=resume["title"],
    css=css,
    body=f"<main class='rf-page rf-ats-classic'>{body}</main>",
  )
