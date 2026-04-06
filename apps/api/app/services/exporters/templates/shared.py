from __future__ import annotations

from html import escape
from pathlib import Path
import re
from typing import Any


def text(value: object) -> str:
  return str(value or "").strip()


def as_list(value: object) -> list[Any]:
  return value if isinstance(value, list) else []


def unique_text_list(items: list[object]) -> list[str]:
  seen: set[str] = set()
  output: list[str] = []
  for item in items:
    current = text(item)
    if not current:
      continue
    dedupe_key = current.casefold()
    if dedupe_key in seen:
      continue
    seen.add(dedupe_key)
    output.append(current)
  return output


def dedupe_sentences(value: object) -> str:
  source = text(value)
  if not source:
    return ""
  sentences = re.split(r"(?<=[.!?])\s+", source)
  output: list[str] = []
  seen: set[str] = set()
  for sentence in sentences:
    normalized = text(sentence)
    if not normalized:
      continue
    dedupe_key = re.sub(r"\s+", " ", normalized).casefold()
    if dedupe_key in seen:
      continue
    seen.add(dedupe_key)
    output.append(normalized)
  return " ".join(output)


def format_date_range(start: str, end: str) -> str:
  return " - ".join([part for part in [text(start), text(end)] if part]).strip(" -")


def _value_from_dict(payload: object, key: str) -> object:
  if not isinstance(payload, dict):
    return None
  return payload.get(key)


def normalize_resume_input(resume_json: dict[str, Any]) -> dict[str, Any]:
  content = _value_from_dict(resume_json, "content")
  basics = _value_from_dict(content, "basics")

  full_name = text(_value_from_dict(basics, "fullName")) or text(_value_from_dict(resume_json, "title")) or "Resume"
  title = text(_value_from_dict(resume_json, "title")) or full_name
  headline = text(_value_from_dict(basics, "title"))
  photo_url = (
    text(_value_from_dict(basics, "photoUrl"))
    or text(_value_from_dict(basics, "photo_url"))
    or text(_value_from_dict(basics, "photo"))
    or ""
  )

  email = text(_value_from_dict(basics, "email"))
  phone = text(_value_from_dict(basics, "phone"))
  location = text(_value_from_dict(basics, "location"))
  linkedin = text(_value_from_dict(basics, "linkedin"))
  website = text(_value_from_dict(basics, "website"))
  contact_items = [value for value in [email, phone, location, linkedin, website] if value]

  experience: list[dict[str, Any]] = []
  for entry in as_list(_value_from_dict(content, "workExperience")):
    role = text(_value_from_dict(entry, "title"))
    company = text(_value_from_dict(entry, "company"))
    start = text(_value_from_dict(entry, "startDate"))
    end = "Present" if _value_from_dict(entry, "current") else text(_value_from_dict(entry, "endDate"))
    bullets = unique_text_list(as_list(_value_from_dict(entry, "bullets")))
    if role or company or start or end or bullets:
      experience.append(
        {
          "role": role,
          "company": company,
          "start": start,
          "end": end,
          "date_range": format_date_range(start, end),
          "bullets": bullets,
        }
      )

  education: list[dict[str, Any]] = []
  for entry in as_list(_value_from_dict(content, "education")):
    degree = text(_value_from_dict(entry, "degree"))
    institution = text(_value_from_dict(entry, "institution"))
    start = text(_value_from_dict(entry, "startDate"))
    end = text(_value_from_dict(entry, "endDate"))
    if degree or institution or start or end:
      education.append(
        {
          "degree": degree,
          "institution": institution,
          "start": start,
          "end": end,
          "date_range": format_date_range(start, end),
        }
      )

  projects: list[dict[str, Any]] = []
  for entry in as_list(_value_from_dict(content, "projects")):
    name = text(_value_from_dict(entry, "name"))
    description = dedupe_sentences(_value_from_dict(entry, "description"))
    link = text(_value_from_dict(entry, "link"))
    technologies = unique_text_list(as_list(_value_from_dict(entry, "technologies")))
    bullets = unique_text_list(as_list(_value_from_dict(entry, "bullets")))
    if name or description or link or technologies or bullets:
      projects.append(
        {
          "name": name,
          "description": description,
          "link": link,
          "technologies": technologies,
          "bullets": bullets,
        }
      )

  certifications: list[dict[str, Any]] = []
  for entry in as_list(_value_from_dict(content, "certifications")):
    name = text(_value_from_dict(entry, "name"))
    issuer = text(_value_from_dict(entry, "issuer"))
    cert_date = text(_value_from_dict(entry, "date"))
    link = text(_value_from_dict(entry, "link"))
    if name or issuer or cert_date or link:
      certifications.append(
        {
          "name": name,
          "issuer": issuer,
          "date": cert_date,
          "link": link,
        }
      )

  return {
    "title": title,
    "basics": {
      "full_name": full_name,
      "headline": headline,
      "email": email,
      "phone": phone,
      "location": location,
      "linkedin": linkedin,
      "website": website,
      "photo_url": photo_url,
      "contact_items": contact_items,
      "contact_line": " | ".join(contact_items),
    },
    "summary": dedupe_sentences(_value_from_dict(content, "summary")),
    "skills": unique_text_list(as_list(_value_from_dict(content, "skills"))),
    "experience": experience,
    "education": education,
    "projects": projects,
    "certifications": certifications,
  }


def read_css(path: Path) -> str:
  return path.read_text(encoding="utf-8")


def render_document(*, title: str, css: str, body: str) -> str:
  safe_title = escape(text(title) or "Resume")
  return (
    "<!DOCTYPE html>"
    "<html>"
    "<head>"
    "<meta charset='utf-8' />"
    f"<title>{safe_title}</title>"
    f"<style>{css}</style>"
    "</head>"
    f"<body>{body}</body>"
    "</html>"
  )


def _escaped_link(value: str) -> str:
  current = text(value)
  if not current:
    return ""
  escaped = escape(current)
  lower = current.casefold()
  if lower.startswith("http://") or lower.startswith("https://"):
    return f"<a href='{escaped}'>{escaped}</a>"
  return escaped


def render_header(
  resume: dict[str, Any],
  *,
  show_photo: bool = False,
  class_name: str = "rf-header",
  contact_separator: str = " | ",
) -> str:
  basics = resume["basics"]
  full_name = escape(text(basics["full_name"]) or "Resume")
  headline = escape(text(basics["headline"]))
  contact_items = [escape(text(item)) for item in basics["contact_items"] if text(item)]
  contact_line = contact_separator.join(contact_items)
  photo_url = escape(text(basics.get("photo_url", "")))

  photo_html = ""
  if show_photo and photo_url:
    photo_html = (
      "<div class='rf-photo-wrap'>"
      f"<img class='rf-photo' src='{photo_url}' alt='Profile photo' />"
      "</div>"
    )

  headline_html = f"<p class='rf-headline'>{headline}</p>" if headline and headline.casefold() != full_name.casefold() else ""
  contact_html = f"<p class='rf-contact-line'>{contact_line}</p>" if contact_line else ""

  return (
    f"<header class='{class_name}'>"
    "<div class='rf-header-main'>"
    "<div class='rf-header-identity'>"
    f"<h1>{full_name}</h1>"
    f"{headline_html}"
    f"{contact_html}"
    "</div>"
    f"{photo_html}"
    "</div>"
    "</header>"
  )


def render_summary(resume: dict[str, Any], *, heading: str = "Summary", class_name: str = "rf-section rf-summary") -> str:
  summary = escape(text(resume["summary"]))
  if not summary:
    return ""
  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"<p class='rf-summary-text'>{summary}</p>"
    "</section>"
  )


def render_experience(
  resume: dict[str, Any],
  *,
  heading: str = "Experience",
  class_name: str = "rf-section rf-experience",
) -> str:
  entries = resume["experience"]
  if not entries:
    return ""

  html_entries: list[str] = []
  for entry in entries:
    role_company = " | ".join([part for part in [text(entry["role"]), text(entry["company"])] if part]).strip(" |")
    heading_html = f"<p class='rf-entry-heading'>{escape(role_company)}</p>" if role_company else ""
    date_html = f"<p class='rf-entry-date'>{escape(text(entry['date_range']))}</p>" if text(entry["date_range"]) else ""
    bullets_html = "".join([f"<li>{escape(item)}</li>" for item in entry["bullets"]])
    bullet_list_html = f"<ul class='rf-bullets'>{bullets_html}</ul>" if bullets_html else ""
    html_entries.append(
      "<article class='rf-entry'>"
      "<div class='rf-entry-head'>"
      f"{heading_html}"
      f"{date_html}"
      "</div>"
      f"{bullet_list_html}"
      "</article>"
    )

  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"{''.join(html_entries)}"
    "</section>"
  )


def render_education(
  resume: dict[str, Any],
  *,
  heading: str = "Education",
  class_name: str = "rf-section rf-education",
) -> str:
  entries = resume["education"]
  if not entries:
    return ""

  html_entries: list[str] = []
  for entry in entries:
    line = " - ".join([part for part in [text(entry["degree"]), text(entry["institution"])] if part]).strip(" -")
    title_html = f"<p class='rf-entry-heading'>{escape(line)}</p>" if line else ""
    date_html = f"<p class='rf-entry-date'>{escape(text(entry['date_range']))}</p>" if text(entry["date_range"]) else ""
    html_entries.append(
      "<article class='rf-entry'>"
      "<div class='rf-entry-head'>"
      f"{title_html}"
      f"{date_html}"
      "</div>"
      "</article>"
    )

  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"{''.join(html_entries)}"
    "</section>"
  )


def render_skills(
  resume: dict[str, Any],
  *,
  heading: str = "Skills",
  class_name: str = "rf-section rf-skills",
) -> str:
  skills = resume["skills"]
  if not skills:
    return ""
  skills_line = ", ".join([escape(item) for item in skills])
  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"<p class='rf-skills-line'>{skills_line}</p>"
    "</section>"
  )


def render_projects(
  resume: dict[str, Any],
  *,
  heading: str = "Projects",
  class_name: str = "rf-section rf-projects",
) -> str:
  projects = resume["projects"]
  if not projects:
    return ""

  html_entries: list[str] = []
  for entry in projects:
    title_html = f"<p class='rf-entry-heading'>{escape(text(entry['name']))}</p>" if text(entry["name"]) else ""
    description_html = f"<p>{escape(text(entry['description']))}</p>" if text(entry["description"]) else ""
    technologies_line = ", ".join([escape(item) for item in entry["technologies"]])
    technologies_html = f"<p class='rf-meta-line'>Technologies: {technologies_line}</p>" if technologies_line else ""
    bullets_html = "".join([f"<li>{escape(item)}</li>" for item in entry["bullets"]])
    bullet_list_html = f"<ul class='rf-bullets'>{bullets_html}</ul>" if bullets_html else ""
    link_html = f"<p class='rf-link-line'>{_escaped_link(text(entry['link']))}</p>" if text(entry["link"]) else ""
    html_entries.append(
      "<article class='rf-entry'>"
      f"{title_html}"
      f"{technologies_html}"
      f"{description_html}"
      f"{bullet_list_html}"
      f"{link_html}"
      "</article>"
    )

  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"{''.join(html_entries)}"
    "</section>"
  )


def render_certifications(
  resume: dict[str, Any],
  *,
  heading: str = "Certifications",
  class_name: str = "rf-section rf-certifications",
) -> str:
  certifications = resume["certifications"]
  if not certifications:
    return ""

  html_entries: list[str] = []
  for entry in certifications:
    line = " - ".join([part for part in [text(entry["name"]), text(entry["issuer"])] if part]).strip(" -")
    cert_date = text(entry["date"])
    if cert_date:
      line = f"{line} ({cert_date})" if line else cert_date
    title_html = f"<p class='rf-entry-heading'>{escape(line)}</p>" if line else ""
    link_html = f"<p class='rf-link-line'>{_escaped_link(text(entry['link']))}</p>" if text(entry["link"]) else ""
    html_entries.append(
      "<article class='rf-entry'>"
      f"{title_html}"
      f"{link_html}"
      "</article>"
    )

  return (
    f"<section class='{class_name}'>"
    f"<h2 class='rf-section-title'>{escape(heading)}</h2>"
    f"{''.join(html_entries)}"
    "</section>"
  )
