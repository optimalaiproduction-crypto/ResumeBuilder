from __future__ import annotations

from html import escape
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
  text,
)

metadata = {
  "id": "modern_sidebar",
  "name": "Modern Sidebar",
  "category": "modern",
  "supports_photo": True,
  "columns": 2,
  "ats_friendly": True,
  "ats_score": 86,
  "aliases": ("modern",),
}


def _render_contact_card(resume: dict[str, Any]) -> str:
  basics = resume["basics"]
  parts = [
    text(basics.get("email")),
    text(basics.get("phone")),
    text(basics.get("location")),
    text(basics.get("linkedin")),
    text(basics.get("website")),
  ]
  lines = "".join([f"<li>{escape(part)}</li>" for part in parts if part])
  if not lines:
    return ""

  return (
    "<section class='rf-section rf-contact-card'>"
    "<h2 class='rf-section-title'>Contact</h2>"
    f"<ul class='rf-compact-list'>{lines}</ul>"
    "</section>"
  )


def render(resume: dict[str, Any]) -> str:
  css = read_css(Path(__file__).with_name("styles.css"))

  main_sections = [
    render_summary(resume, heading="Summary", class_name="rf-section rf-summary"),
    render_experience(resume, heading="Experience", class_name="rf-section rf-experience"),
    render_projects(resume, heading="Projects", class_name="rf-section rf-projects"),
  ]
  side_sections = [
    _render_contact_card(resume),
    render_skills(resume, heading="Skills", class_name="rf-section rf-skills"),
    render_education(resume, heading="Education", class_name="rf-section rf-education"),
    render_certifications(resume, heading="Certifications", class_name="rf-section rf-certifications"),
  ]

  header = render_header(
    resume,
    show_photo=True,
    class_name="rf-header rf-header-modern-sidebar",
    contact_separator=" • ",
  )
  body = (
    f"{header}"
    "<div class='rf-columns'>"
    f"<section class='rf-main-col'>{''.join([section for section in main_sections if section])}</section>"
    f"<aside class='rf-side-col'>{''.join([section for section in side_sections if section])}</aside>"
    "</div>"
  )

  return render_document(
    title=resume["title"],
    css=css,
    body=f"<main class='rf-page rf-modern-sidebar'>{body}</main>",
  )
