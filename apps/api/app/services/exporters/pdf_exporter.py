from __future__ import annotations

from html import escape
from io import BytesIO
import re


def export_pdf_from_html(html: str) -> bytes:
  from weasyprint import HTML

  return HTML(string=html).write_pdf()


def _text(value: object) -> str:
  return str(value or "").strip()


def _clean_unique(items: list[object]) -> list[str]:
  seen: set[str] = set()
  clean: list[str] = []
  for item in items:
    value = _text(item)
    if not value:
      continue
    key = value.casefold()
    if key in seen:
      continue
    seen.add(key)
    clean.append(value)
  return clean


def _dedupe_sentences(text: str) -> str:
  value = _text(text)
  if not value:
    return ""
  parts = re.split(r"(?<=[.!?])\s+", value)
  output: list[str] = []
  seen: set[str] = set()
  for part in parts:
    sentence = _text(part)
    if not sentence:
      continue
    key = re.sub(r"\s+", " ", sentence).casefold()
    if key in seen:
      continue
    seen.add(key)
    output.append(sentence)
  return " ".join(output)


def _clean_resume_content(title: str, content: dict) -> dict:
  basics = content.get("basics", {})
  email = _text(basics.get("email"))
  phone = _text(basics.get("phone"))
  location = _text(basics.get("location"))
  linkedin = _text(basics.get("linkedin"))
  website = _text(basics.get("website"))
  full_name = _text(basics.get("fullName")) or _text(title) or "Resume"
  headline = _text(basics.get("title"))
  contact = [
    part
    for part in [
      email,
      phone,
      location,
      linkedin,
      website,
    ]
    if part
  ]

  summary = _dedupe_sentences(_text(content.get("summary")))
  skills = _clean_unique(content.get("skills", []))

  work_items: list[dict] = []
  seen_work: set[str] = set()
  for item in content.get("workExperience", []):
    role = _text(item.get("title"))
    company = _text(item.get("company"))
    start = _text(item.get("startDate"))
    end = "Present" if item.get("current") else _text(item.get("endDate"))
    bullets = _clean_unique(item.get("bullets", []))
    signature = "|".join(
      [
        role.casefold(),
        company.casefold(),
        start.casefold(),
        end.casefold(),
        "||".join([bullet.casefold() for bullet in bullets]),
      ]
    )
    if (role or company or start or end or bullets) and signature not in seen_work:
      seen_work.add(signature)
      work_items.append(
        {
          "role": role,
          "company": company,
          "start": start,
          "end": end,
          "bullets": bullets,
        }
      )

  education_items: list[dict] = []
  seen_education: set[str] = set()
  for item in content.get("education", []):
    degree = _text(item.get("degree"))
    institution = _text(item.get("institution"))
    start = _text(item.get("startDate"))
    end = _text(item.get("endDate"))
    signature = "|".join([degree.casefold(), institution.casefold(), start.casefold(), end.casefold()])
    if (degree or institution or start or end) and signature not in seen_education:
      seen_education.add(signature)
      education_items.append(
        {
          "degree": degree,
          "institution": institution,
          "start": start,
          "end": end,
        }
      )

  project_items: list[dict] = []
  seen_projects: set[str] = set()
  for item in content.get("projects", []):
    name = _text(item.get("name"))
    description = _dedupe_sentences(_text(item.get("description")))
    link = _text(item.get("link"))
    technologies = _clean_unique(item.get("technologies", []))
    bullets = _clean_unique(item.get("bullets", []))
    signature = "|".join(
      [
        name.casefold(),
        description.casefold(),
        link.casefold(),
        "||".join([tech.casefold() for tech in technologies]),
        "||".join([bullet.casefold() for bullet in bullets]),
      ]
    )
    if (name or description or link or technologies or bullets) and signature not in seen_projects:
      seen_projects.add(signature)
      project_items.append(
        {
          "name": name,
          "description": description,
          "link": link,
          "technologies": technologies,
          "bullets": bullets,
        }
      )

  cert_items: list[dict] = []
  seen_certs: set[str] = set()
  for item in content.get("certifications", []):
    name = _text(item.get("name"))
    issuer = _text(item.get("issuer"))
    cert_date = _text(item.get("date"))
    link = _text(item.get("link"))
    signature = "|".join([name.casefold(), issuer.casefold(), cert_date.casefold(), link.casefold()])
    if (name or issuer or cert_date or link) and signature not in seen_certs:
      seen_certs.add(signature)
      cert_items.append(
        {
          "name": name,
          "issuer": issuer,
          "date": cert_date,
          "link": link,
        }
      )

  return {
    "full_name": full_name,
    "resume_title": _text(title),
    "headline": headline,
    "email": email,
    "phone": phone,
    "location": location,
    "linkedin": linkedin,
    "website": website,
    "contact": contact,
    "summary": summary,
    "skills": skills,
    "work": work_items,
    "education": education_items,
    "projects": project_items,
    "certifications": cert_items,
  }


def _format_date_range(start: str, end: str) -> str:
  return " - ".join([part for part in [start, end] if _text(part)]).strip(" -")


def _export_pdf_reportlab(title: str, content: dict) -> bytes:
  from reportlab.lib.pagesizes import A4
  from reportlab.lib.utils import simpleSplit
  from reportlab.pdfgen import canvas

  cleaned = _clean_resume_content(title=title, content=content)
  page_width, page_height = A4
  margin = 42
  content_width = page_width - (2 * margin)
  buffer = BytesIO()
  pdf = canvas.Canvas(buffer, pagesize=A4)
  pdf.setTitle(cleaned["full_name"])
  y = page_height - margin

  heading_color = (0.07, 0.11, 0.19)
  text_color = (0.1, 0.14, 0.22)
  muted_color = (0.32, 0.38, 0.47)
  link_color = (0.04, 0.41, 0.63)
  accent_color = (0.06, 0.52, 0.72)
  body_size = 11.2
  body_leading = 17.8
  bullet_size = 11.0
  bullet_leading = 16.5

  def next_page() -> None:
    nonlocal y
    pdf.showPage()
    pdf.setTitle(cleaned["full_name"])
    y = page_height - margin

  def ensure_space(height: float) -> None:
    if y - height < margin:
      next_page()

  def draw_wrapped(
    text: str,
    font: str,
    size: float,
    leading: float,
    gap_after: float = 3,
    *,
    x: float = margin,
    width: float = content_width,
    color: tuple[float, float, float] = text_color,
  ) -> None:
    nonlocal y
    value = _text(text)
    if not value:
      return
    lines = simpleSplit(value, font, size, width) or [value]
    ensure_space((len(lines) * leading) + gap_after)
    pdf.setFillColorRGB(*color)
    pdf.setFont(font, size)
    for line in lines:
      pdf.drawString(x, y, line)
      y -= leading
    y -= gap_after

  def draw_section_heading(label: str) -> None:
    nonlocal y
    ensure_space(24)
    pdf.setFillColorRGB(*heading_color)
    pdf.setFont("Helvetica-Bold", 12.2)
    pdf.drawString(margin, y, label.upper())
    y -= 15.5

  def draw_entry_heading(left: str, right: str | None = None) -> None:
    nonlocal y
    left_text = _text(left)
    right_text = _text(right)
    if not left_text and not right_text:
      return
    right_slot_width = 130 if right_text else 0
    left_width = content_width - right_slot_width - (8 if right_text else 0)
    left_lines = simpleSplit(left_text, "Helvetica-Bold", 10.9, left_width) or [left_text]
    line_height = 16.5
    ensure_space((len(left_lines) * line_height) + 1)
    for idx, line in enumerate(left_lines):
      pdf.setFillColorRGB(*heading_color)
      pdf.setFont("Helvetica-Bold", 10.9)
      pdf.drawString(margin, y, line)
      if idx == 0 and right_text:
        pdf.setFillColorRGB(*muted_color)
        pdf.setFont("Helvetica-Oblique", 9.5)
        date_x = margin + content_width - pdf.stringWidth(right_text, "Helvetica-Oblique", 9.5)
        pdf.drawString(date_x, y, right_text)
      y -= line_height
    y -= 2.2

  def draw_bullets(items: list[str]) -> None:
    nonlocal y
    for item in items:
      value = _text(item)
      if not value:
        continue
      bullet_x = margin + 2
      text_x = margin + 14
      text_width = content_width - 14
      lines = simpleSplit(value, "Helvetica", bullet_size, text_width) or [value]
      line_height = bullet_leading
      ensure_space((len(lines) * line_height) + 1.5)
      pdf.setFillColorRGB(*text_color)
      pdf.setStrokeColorRGB(*accent_color)
      pdf.setFillColorRGB(*accent_color)
      pdf.circle(bullet_x + 1.8, y + 2.9, 1.6, stroke=1, fill=1)
      pdf.setFillColorRGB(*text_color)
      pdf.setFont("Helvetica", bullet_size)
      for line in lines:
        pdf.drawString(text_x, y, line)
        y -= line_height
      y -= 2.6
    if items:
      y -= 4.2

  draw_wrapped(cleaned["full_name"], "Helvetica-Bold", 26, 29.5, 2.2, color=heading_color)
  if cleaned["headline"] and cleaned["headline"].casefold() != cleaned["full_name"].casefold():
    draw_wrapped(cleaned["headline"], "Helvetica-Bold", 12.5, 16.8, 3.2, color=muted_color)
  if cleaned["contact"]:
    draw_wrapped(" | ".join(cleaned["contact"]), "Helvetica", 11.0, 15.6, 10.5, color=muted_color)
  else:
    y -= 7

  if cleaned["summary"]:
    draw_section_heading("Summary")
    draw_wrapped(cleaned["summary"], "Helvetica", body_size, body_leading, 8)

  if cleaned["skills"]:
    draw_section_heading("Skills")
    draw_wrapped(", ".join(cleaned["skills"]), "Helvetica", body_size, body_leading, 8)

  if cleaned["work"]:
    draw_section_heading("Work Experience")
    for item in cleaned["work"]:
      header = " | ".join([part for part in [item["role"], item["company"]] if part]).strip(" |")
      date_line = _format_date_range(item["start"], item["end"])
      draw_entry_heading(header, date_line)
      draw_bullets(item["bullets"])
      y -= 3.5

  if cleaned["education"]:
    draw_section_heading("Education")
    for item in cleaned["education"]:
      line = " - ".join([part for part in [item["degree"], item["institution"]] if part]).strip(" -")
      date_line = _format_date_range(item.get("start", ""), item.get("end", ""))
      draw_entry_heading(line, date_line)
    y -= 4.5

  if cleaned["projects"]:
    draw_section_heading("Projects")
    for item in cleaned["projects"]:
      if item["name"]:
        draw_entry_heading(item["name"], None)
      if item["description"]:
        draw_wrapped(item["description"], "Helvetica", body_size, body_leading, 2.2)
      if item["link"]:
        draw_wrapped(item["link"], "Helvetica", 10.2, 14.3, 1.6, color=link_color)
      draw_bullets(item["bullets"])
      y -= 3.2

  if cleaned["certifications"]:
    draw_section_heading("Certifications")
    for item in cleaned["certifications"]:
      line = " - ".join([part for part in [item["name"], item["issuer"]] if part]).strip(" -")
      if item["date"]:
        line = f"{line} ({item['date']})" if line else item["date"]
      if line:
        draw_wrapped(line, "Helvetica-Bold", 11.1, 15.8, 1.4, color=heading_color)
      if item["link"]:
        draw_wrapped(item["link"], "Helvetica", 10.2, 14.3, 1.8, color=link_color)

  pdf.save()
  buffer.seek(0)
  return buffer.read()


def _link_or_text(value: str) -> str:
  clean = _text(value)
  if not clean:
    return ""
  escaped = escape(clean)
  lower = clean.casefold()
  if lower.startswith("http://") or lower.startswith("https://"):
    return f'<a href="{escaped}">{escaped}</a>'
  return escaped


def _categorize_skills(skills: list[str]) -> dict[str, list[str]]:
  technical_keywords = [
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "html",
    "css",
    "docker",
    "kubernetes",
    "api",
    "rest",
    "graphql",
    "aws",
    "azure",
    "gcp",
    "linux",
  ]
  tool_keywords = [
    "excel",
    "tableau",
    "power bi",
    "figma",
    "jira",
    "notion",
    "postman",
    "github",
    "greenhouse",
    "looker",
  ]
  framework_keywords = [
    "react",
    "next",
    "vue",
    "angular",
    "fastapi",
    "django",
    "flask",
    "spring",
    "express",
    "tailwind",
  ]
  soft_keywords = [
    "communication",
    "leadership",
    "problem solving",
    "collaboration",
    "teamwork",
    "stakeholder",
    "time management",
    "adaptability",
  ]

  def pick_by_keywords(values: list[str], keywords: list[str]) -> list[str]:
    output: list[str] = []
    for value in values:
      lower = value.casefold()
      if any(keyword in lower or lower in keyword for keyword in keywords):
        output.append(value)
    return _clean_unique(output)

  technical = pick_by_keywords(skills, technical_keywords)
  tools = pick_by_keywords(skills, tool_keywords)
  frameworks = pick_by_keywords(skills, framework_keywords)
  soft = pick_by_keywords(skills, soft_keywords)

  used = {item.casefold() for item in [*technical, *tools, *frameworks, *soft]}
  uncategorized = [skill for skill in skills if skill.casefold() not in used]

  if not technical and uncategorized:
    technical = uncategorized[:8]

  return {
    "technical": technical,
    "tools": tools,
    "frameworks": frameworks,
    "soft": soft,
  }


def _extract_achievements_from_work(work_items: list[dict]) -> list[str]:
  achievement_regex = re.compile(r"\d|improv|increas|reduc|launched|led|optimized|saved", re.IGNORECASE)
  collected: list[str] = []
  for item in work_items:
    for bullet in item.get("bullets", []):
      value = _text(bullet)
      if value and achievement_regex.search(value):
        collected.append(value)
  return _clean_unique(collected)[:5]


def _export_pdf_weasyprint(title: str, content: dict) -> bytes:
  from weasyprint import HTML

  cleaned = _clean_resume_content(title=title, content=content)
  categorized_skills = _categorize_skills(cleaned["skills"])
  achievements = _extract_achievements_from_work(cleaned["work"])

  name = cleaned["full_name"]
  headline = cleaned["headline"] if cleaned["headline"].casefold() != name.casefold() else ""
  subtitle = cleaned["resume_title"] if cleaned["resume_title"].casefold() != name.casefold() else ""

  def render_contact_item(value: str) -> str:
    clean = _text(value)
    if not clean:
      return ""
    return f"<p class='contact-item'>{_link_or_text(clean)}</p>"

  def render_chip_list(values: list[str]) -> str:
    chips = "".join([f"<span class='chip'>{escape(value)}</span>" for value in _clean_unique(values)])
    return f"<div class='chips'>{chips}</div>" if chips else ""

  def render_skill_block(label: str, values: list[str]) -> str:
    if not values:
      return ""
    return (
      "<div class='skill-block'>"
      f"<p class='meta-title'>{escape(label)}</p>"
      f"{render_chip_list(values)}"
      "</div>"
    )

  profile_parts: list[str] = [
    "<aside class='card card-hero'>",
    "<div class='profile-top'>",
    "<p class='meta-kicker'>Professional Profile</p>",
    "<span class='ats-pill'>ATS-READY</span>",
    "</div>",
    f"<h1>{escape(name)}</h1>",
  ]
  if headline:
    profile_parts.append(f"<p class='headline'>{escape(headline)}</p>")
  elif subtitle:
    profile_parts.append(f"<p class='headline'>{escape(subtitle)}</p>")
  if cleaned["summary"]:
    profile_parts.append("<div class='profile-divider'></div>")
    profile_parts.append("<h2>Summary</h2>")
    profile_parts.append(f"<p class='summary'>{escape(cleaned['summary'])}</p>")
  profile_parts.append("</aside>")

  right_column_parts: list[str] = []
  contact_details = "".join(
    [
      render_contact_item(cleaned["email"]),
      render_contact_item(cleaned["phone"]),
      render_contact_item(cleaned["location"]),
      render_contact_item(cleaned["linkedin"]),
      render_contact_item(cleaned["website"]),
    ]
  )
  if contact_details:
    right_column_parts.append(
      "<aside class='card'>"
      "<h2>Contact Information</h2>"
      f"{contact_details}"
      "</aside>"
    )

  skill_blocks = "".join(
    [
      render_skill_block("Technical Skills", categorized_skills["technical"][:8]),
      render_skill_block("Tools", categorized_skills["tools"][:6]),
      render_skill_block("Frameworks", categorized_skills["frameworks"][:6]),
      render_skill_block("Soft Skills", categorized_skills["soft"][:6]),
    ]
  )
  if skill_blocks:
    right_column_parts.append(
      "<aside class='card'>"
      "<h2>Skills</h2>"
      f"{skill_blocks}"
      "</aside>"
    )

  if cleaned["education"]:
    education_entries: list[str] = []
    for item in cleaned["education"]:
      title_line = " - ".join([part for part in [item["degree"], item["institution"]] if part]).strip(" -")
      date_line = _format_date_range(item["start"], item["end"])
      if not title_line and not date_line:
        continue
      education_entries.append(
        "<div class='entry'>"
        f"{'<p class=\"entry-title\">' + escape(title_line) + '</p>' if title_line else ''}"
        f"{'<p class=\"entry-date\">' + escape(date_line) + '</p>' if date_line else ''}"
        "</div>"
      )
    if education_entries:
      right_column_parts.append(
        "<aside class='card'>"
        "<h2>Education</h2>"
        f"{''.join(education_entries)}"
        "</aside>"
      )

  if cleaned["certifications"]:
    cert_entries: list[str] = []
    for item in cleaned["certifications"]:
      line = " - ".join([part for part in [item["name"], item["issuer"]] if part]).strip(" -")
      if item["date"]:
        line = f"{line} ({item['date']})" if line else item["date"]
      if not line and not item["link"]:
        continue
      cert_entries.append(
        "<div class='entry'>"
        f"{'<p class=\"entry-title\">' + escape(line) + '</p>' if line else ''}"
        f"{'<p class=\"entry-link\">' + _link_or_text(item['link']) + '</p>' if item['link'] else ''}"
        "</div>"
      )
    if cert_entries:
      right_column_parts.append(
        "<aside class='card'>"
        "<h2>Certifications</h2>"
        f"{''.join(cert_entries)}"
        "</aside>"
      )

  if achievements:
    achievement_items = "".join([f"<li>{escape(item)}</li>" for item in achievements])
    right_column_parts.append(
      "<aside class='card'>"
      "<h2>Achievements</h2>"
      f"<ul>{achievement_items}</ul>"
      "</aside>"
    )

  left_column_parts: list[str] = [""]
  if cleaned["work"]:
    work_entries: list[str] = []
    for item in cleaned["work"]:
      header = " | ".join([part for part in [item["role"], item["company"]] if part]).strip(" |")
      date_line = _format_date_range(item["start"], item["end"])
      bullets = "".join([f"<li>{escape(bullet)}</li>" for bullet in item["bullets"]])
      if not header and not date_line and not bullets:
        continue
      work_entries.append(
        "<div class='entry'>"
        "<div class='entry-head'>"
        f"{'<p class=\"entry-title\">' + escape(header) + '</p>' if header else ''}"
        f"{'<p class=\"entry-date\">' + escape(date_line) + '</p>' if date_line else ''}"
        "</div>"
        f"{'<ul>' + bullets + '</ul>' if bullets else ''}"
        "</div>"
      )
    if work_entries:
      left_column_parts.append(
        "<aside class='card'>"
        "<h2>Work Experience</h2>"
        f"{''.join(work_entries)}"
        "</aside>"
      )

  if cleaned["projects"]:
    project_entries: list[str] = []
    for item in cleaned["projects"]:
      tech_line = ", ".join(item.get("technologies", []))
      bullets = "".join([f"<li>{escape(bullet)}</li>" for bullet in item["bullets"]])
      if not (item["name"] or item["description"] or tech_line or item["link"] or bullets):
        continue
      project_entries.append(
        "<div class='entry'>"
        f"{'<p class=\"entry-title\">' + escape(item['name']) + '</p>' if item['name'] else ''}"
        f"{'<p class=\"entry-tech\">Tech Stack: ' + escape(tech_line) + '</p>' if tech_line else ''}"
        f"{'<p>' + escape(item['description']) + '</p>' if item['description'] else ''}"
        f"{'<p class=\"entry-link\">' + _link_or_text(item['link']) + '</p>' if item['link'] else ''}"
        f"{'<ul>' + bullets + '</ul>' if bullets else ''}"
        "</div>"
      )
    if project_entries:
      left_column_parts.append(
        "<aside class='card'>"
        "<h2>Projects</h2>"
        f"{''.join(project_entries)}"
        "</aside>"
      )

  html = f"""
  <html>
    <head>
      <style>
        @page {{
          size: A4;
          margin: 13mm 11mm;
        }}
        body {{
          font-family: "Inter", "Segoe UI", Calibri, Arial, sans-serif;
          color: #0f172a;
          line-height: 1.58;
          font-size: 10.9pt;
          margin: 0;
          background: #f5f9ff;
        }}
        .page {{
          border: 1px solid #d6e3f2;
          border-radius: 14px;
          background: linear-gradient(180deg, #f8fbff 0%, #f1f7ff 100%);
          padding: 10px;
        }}
        .grid {{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }}
        .col {{
          display: grid;
          gap: 10px;
          align-content: start;
        }}
        .card {{
          border: 1px solid #c9dcef;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(249, 252, 255, 0.95), #ffffff);
          padding: 11px 12px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          break-inside: avoid;
          page-break-inside: avoid;
        }}
        .card-hero {{
          background:
            linear-gradient(180deg, rgba(11, 152, 209, 0.08) 0%, rgba(11, 152, 209, 0) 62%),
            linear-gradient(180deg, rgba(249, 252, 255, 0.96), #ffffff);
        }}
        .profile-top {{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }}
        .meta-kicker {{
          margin: 0;
          font-size: 8.1pt;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #0f6ca2;
          font-weight: 700;
        }}
        .ats-pill {{
          border: 1px solid #b9d9f5;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 8pt;
          letter-spacing: 0.07em;
          font-weight: 700;
          color: #0b6fa8;
          background: #e9f4ff;
        }}
        h1 {{
          margin: 0;
          font-size: 25pt;
          line-height: 1.08;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #0f172a;
        }}
        .headline {{
          margin: 2px 0 0;
          font-size: 13.3pt;
          font-weight: 600;
          color: #334155;
        }}
        .profile-divider {{
          margin: 10px 0 8px;
          border-top: 1px solid #d9e6f4;
        }}
        h2 {{
          margin: 0;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #0f172a;
        }}
        .summary {{
          margin: 6px 0 0;
          font-size: 11.4pt;
          line-height: 1.74;
          color: #334155;
        }}
        .entry {{
          margin-top: 8px;
          border-left: 2px solid #d7e8f8;
          padding-left: 9px;
        }}
        .entry-head {{
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }}
        .entry-title {{
          margin: 0;
          font-weight: 700;
          font-size: 12.7pt;
          color: #0f172a;
        }}
        .entry-date {{
          margin: 0;
          white-space: nowrap;
          font-size: 10.4pt;
          color: #64748b;
          font-weight: 600;
        }}
        .entry-tech {{
          margin: 3px 0 0;
          font-size: 10pt;
          color: #64748b;
        }}
        p {{
          margin: 4px 0 0;
        }}
        ul {{
          margin: 6px 0 0;
          padding-left: 17px;
        }}
        li {{
          margin: 3px 0;
          color: #334155;
        }}
        li::marker {{
          color: #0e84b8;
        }}
        .chip {{
          display: inline-block;
          margin: 0 6px 6px 0;
          padding: 4px 11px;
          border: 1px solid #c5dbef;
          border-radius: 999px;
          font-size: 9.9pt;
          color: #1f3f5d;
          background: #eef6ff;
        }}
        .chips {{
          margin-top: 4px;
        }}
        .skill-block + .skill-block {{
          margin-top: 8px;
        }}
        .meta-title {{
          margin: 0;
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #64748b;
          font-weight: 700;
        }}
        .contact-item {{
          margin: 0;
          line-height: 1.45;
          color: #334155;
        }}
        .contact-item + .contact-item {{
          margin-top: 4px;
        }}
        .entry-link {{
          margin: 5px 0 0;
          font-size: 10.6pt;
        }}
        a {{
          color: #0369a1;
          text-decoration: none;
        }}
      </style>
    </head>
    <body>
      <main class="page">
        <section class="grid">
          <div class="col">
            {''.join(profile_parts)}
            {''.join(left_column_parts)}
          </div>
          <div class="col">
            {''.join(right_column_parts)}
          </div>
        </section>
      </main>
    </body>
  </html>
  """
  return HTML(string=html).write_pdf()


def export_pdf(title: str, content: dict, preferred_engine: str = "auto") -> bytes:
  errors: list[str] = []
  mode = _text(preferred_engine).lower() or "auto"

  if mode == "reportlab":
    try:
      return _export_pdf_reportlab(title=title, content=content)
    except Exception as exc:
      raise RuntimeError(
        "PDF export failed in Classic ATS mode (ReportLab). "
        "Please retry or switch to Template mode. "
        f"Details: ReportLab export failed: {exc}"
      ) from exc

  if mode == "weasyprint":
    try:
      return _export_pdf_weasyprint(title=title, content=content)
    except Exception as exc:
      errors.append(f"WeasyPrint export failed: {exc}")
      try:
        return _export_pdf_reportlab(title=title, content=content)
      except Exception as fallback_exc:
        errors.append(f"ReportLab fallback failed: {fallback_exc}")
      raise RuntimeError(
        "PDF export failed in Template mode. "
        "WeasyPrint is unavailable and fallback also failed. "
        f"Details: {' | '.join(errors)}"
      ) from exc

  try:
    return _export_pdf_weasyprint(title=title, content=content)
  except Exception as exc:
    errors.append(f"WeasyPrint export failed: {exc}")

  try:
    return _export_pdf_reportlab(title=title, content=content)
  except Exception as exc:
    errors.append(f"ReportLab export failed: {exc}")

  raise RuntimeError(
    "PDF export is currently unavailable. "
    "Install ReportLab (`pip install reportlab`) or WeasyPrint runtime dependencies. "
    f"Details: {' | '.join(errors)}"
  )
