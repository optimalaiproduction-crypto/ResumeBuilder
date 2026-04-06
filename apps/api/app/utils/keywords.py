import re
from collections import Counter

STOP_WORDS = {
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "role",
  "that",
  "the",
  "their",
  "this",
  "to",
  "using",
  "we",
  "will",
  "with",
  "you",
  "your",
  "years",
  "year",
  "experience",
  "job",
  "team",
  "skills",
  "ability",
  "required",
  "preferred"
}

KEYWORD_PHRASES = [
  "machine learning",
  "deep learning",
  "data analysis",
  "data modeling",
  "project management",
  "stakeholder management",
  "agile",
  "scrum",
  "rest api",
  "microservices",
  "system design",
  "ci/cd",
  "unit testing",
  "integration testing",
  "cloud computing",
  "customer success",
  "product strategy",
  "user research",
  "business analysis",
  "risk management",
  "etl pipeline",
  "natural language processing"
]

SPECIAL_TOKENS = {
  "c++",
  "c#",
  "node.js",
  "next.js",
  "react",
  "python",
  "java",
  "golang",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "tableau",
  "powerbi",
  "excel",
  "fastapi",
  "django",
  "flask",
  "typescript",
  "javascript",
  "tensorflow",
  "pytorch",
  "spark",
  "hadoop"
}

ACTION_VERBS = {
  "achieved",
  "automated",
  "built",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "enhanced",
  "executed",
  "improved",
  "increased",
  "launched",
  "led",
  "managed",
  "optimized",
  "owned",
  "reduced",
  "streamlined",
  "shipped",
  "supported"
}


def normalize_tokens(text: str) -> list[str]:
  lowered = text.lower()
  base_tokens = re.findall(r"[a-z][a-z0-9\+\#\.\-]{1,40}", lowered)
  filtered = [token for token in base_tokens if token not in STOP_WORDS]

  discovered_special = [token for token in SPECIAL_TOKENS if token in lowered]
  tokens = filtered + discovered_special
  return [token for token in tokens if token and token not in STOP_WORDS]


def _extract_phrase_hits(text: str) -> list[str]:
  lowered = text.lower()
  hits: list[str] = []
  for phrase in KEYWORD_PHRASES:
    if phrase in lowered:
      hits.append(phrase)
  return hits


def extract_keywords(text: str, limit: int = 20) -> list[str]:
  tokens = normalize_tokens(text)
  phrases = _extract_phrase_hits(text)
  counts = Counter(tokens)

  for phrase in phrases:
    counts[phrase] += 3

  ranked = [
    keyword for keyword, count in counts.most_common()
    if count > 0 and len(keyword) > 1 and keyword not in STOP_WORDS
  ]
  deduped: list[str] = []
  seen: set[str] = set()
  for keyword in ranked:
    normalized = keyword.lower()
    if normalized in seen:
      continue
    seen.add(normalized)
    deduped.append(keyword)
    if len(deduped) >= limit:
      break
  return deduped


def resume_to_plain_text(content: dict) -> str:
  parts: list[str] = []
  basics = content.get("basics", {})
  parts.extend(
    [
      basics.get("fullName", ""),
      basics.get("email", ""),
      basics.get("phone", ""),
      basics.get("linkedin", ""),
      basics.get("location", ""),
      content.get("summary", "")
    ]
  )

  parts.extend(content.get("skills", []))

  for item in content.get("workExperience", []):
    parts.extend([item.get("company", ""), item.get("title", "")])
    parts.extend(item.get("bullets", []))

  for item in content.get("projects", []):
    parts.extend([item.get("name", ""), item.get("description", "")])
    parts.extend(item.get("bullets", []))

  for item in content.get("education", []):
    parts.extend([item.get("institution", ""), item.get("degree", "")])

  for item in content.get("certifications", []):
    parts.extend([item.get("name", ""), item.get("issuer", "")])

  return "\n".join([part for part in parts if part])


def has_measurement(text: str) -> bool:
  return bool(re.search(r"\d", text)) or bool(re.search(r"\b(percent|%|kpi|roi|revenue|cost)\b", text.lower()))


def has_action_verb(text: str) -> bool:
  first = re.findall(r"[a-zA-Z]+", text.lower())
  if not first:
    return False
  return first[0] in ACTION_VERBS


def section_quality_issues(resume_content: dict) -> list[str]:
  issues: list[str] = []
  basics = resume_content.get("basics", {})
  work_items = resume_content.get("workExperience", [])
  skills = resume_content.get("skills", [])
  summary = (resume_content.get("summary") or "").strip()
  education = resume_content.get("education", [])

  if not (basics.get("phone") or "").strip():
    issues.append("Missing phone number")
  if not (basics.get("linkedin") or "").strip():
    issues.append("Missing LinkedIn profile")
  if len(education) == 0:
    issues.append("Missing education details")
  if not summary:
    issues.append("Summary is empty")
  if len(skills) < 5:
    issues.append("Weak skill coverage; add role-relevant tools and technologies")

  bullets: list[str] = []
  for item in work_items:
    bullets.extend([bullet for bullet in item.get("bullets", []) if isinstance(bullet, str)])

  if bullets:
    if not any(has_measurement(bullet) for bullet in bullets):
      issues.append("No measurable achievements yet")
    if not any(has_action_verb(bullet) for bullet in bullets):
      issues.append("Experience bullets should start with stronger action verbs")
  else:
    issues.append("Add at least one work experience bullet")

  return issues


def _keyword_present(keyword: str, resume_tokens: set[str], resume_text_lower: str) -> bool:
  if " " in keyword:
    return keyword.lower() in resume_text_lower
  return keyword.lower() in resume_tokens


def compute_match_score(resume_content: dict, job_description: str) -> dict:
  jd_keywords = extract_keywords(job_description, limit=25)
  resume_text = resume_to_plain_text(resume_content)
  resume_text_lower = resume_text.lower()
  resume_tokens = set(normalize_tokens(resume_text))

  matched = [keyword for keyword in jd_keywords if _keyword_present(keyword, resume_tokens, resume_text_lower)]
  missing = [keyword for keyword in jd_keywords if keyword not in matched]

  keyword_coverage = 0 if not jd_keywords else int((len(matched) / len(jd_keywords)) * 100)
  issues = section_quality_issues(resume_content)
  quality_score = max(0, 100 - (len(issues) * 12))
  score = int((keyword_coverage * 0.7) + (quality_score * 0.3))

  suggestions: list[str] = []
  if missing:
    suggestions.append(f"Add missing ATS terms naturally where true: {', '.join(missing[:8])}.")
  suggestions.extend(issues[:4])
  if not suggestions:
    suggestions.append("Resume is well aligned. Tighten bullets with quantifiable outcomes.")

  return {
    "score": max(0, min(100, score)),
    "matchedKeywords": matched,
    "missingKeywords": missing,
    "suggestions": suggestions[:6]
  }
