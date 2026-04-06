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
  "id": "executive_clean",
  "name": "Executive Clean",
  "category": "executive",
  "supports_photo": False,
  "columns": 1,
  "ats_friendly": True,
  "ats_score": 90,
}


def render(resume: dict[str, Any]) -> str:
  css = read_css(Path(__file__).with_name("styles.css"))

  sections = [
    render_header(resume, class_name="rf-header rf-header-executive", contact_separator=" • "),
    render_summary(resume, heading="Executive Summary", class_name="rf-section rf-summary"),
    render_experience(resume, heading="Professional Experience", class_name="rf-section rf-experience"),
    render_projects(resume, heading="Selected Projects", class_name="rf-section rf-projects"),
    render_education(resume, heading="Education", class_name="rf-section rf-education"),
    render_skills(resume, heading="Core Skills", class_name="rf-section rf-skills"),
    render_certifications(resume, heading="Certifications", class_name="rf-section rf-certifications"),
  ]

  return render_document(
    title=resume["title"],
    css=css,
    body=f"<main class='rf-page rf-executive-clean'>{''.join([section for section in sections if section])}</main>",
  )
