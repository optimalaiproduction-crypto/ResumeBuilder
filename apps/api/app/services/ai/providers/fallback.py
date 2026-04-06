import hashlib
import re

from app.services.ai.types import (
  ImprovementSuggestionResult,
  KeywordExtractionResult,
  ProviderStatus,
  ResumeScoreResult,
  RewriteBulletResult,
  RewriteSummaryResult
)
from app.utils.keywords import (
  compute_match_score,
  extract_keywords,
  has_action_verb,
  has_measurement,
  section_quality_issues
)

WEAK_PREFIX_REPLACEMENTS = [
  (r"^\s*responsible for\s+", "Led "),
  (r"^\s*worked on\s+", "Built "),
  (r"^\s*helped( with)?\s+", "Supported "),
  (r"^\s*in charge of\s+", "Managed "),
  (r"^\s*tasked with\s+", "Executed ")
]

FILLER_PATTERNS = [
  r"\bvery\b",
  r"\bvarious\b",
  r"\bsuccessfully\b",
  r"\bin order to\b"
]

FALLBACK_PROVIDER_MESSAGE = "Fallback mode active: using built-in suggestions."


def rewrite_bullet_deterministic(bullet: str, job_description: str, role_context: str = "") -> RewriteBulletResult:
  original = bullet.strip()
  rewritten = original

  for pattern, replacement in WEAK_PREFIX_REPLACEMENTS:
    rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)

  for filler in FILLER_PATTERNS:
    rewritten = re.sub(filler, "", rewritten, flags=re.IGNORECASE)

  rewritten = re.sub(r"\s+", " ", rewritten).strip()
  if not has_action_verb(rewritten):
    rewritten = f"Delivered {rewritten[:1].lower() + rewritten[1:]}" if rewritten else "Delivered role-relevant outcomes"

  if rewritten and not rewritten.endswith("."):
    rewritten = f"{rewritten}."

  notes: list[str] = []
  if not has_measurement(rewritten):
    notes.append("Consider adding a measurable outcome (percent, time, cost, volume) if accurate.")

  top_keywords = extract_keywords(job_description, limit=3)
  if top_keywords:
    notes.append(f"Align wording with relevant terms where true: {', '.join(top_keywords)}.")
  if role_context.strip():
    notes.append(f"Role context considered: {role_context[:120]}")

  notes.append("Local fallback rewrite used; facts were preserved conservatively.")

  return RewriteBulletResult(
    originalBullet=bullet,
    rewrittenBullet=rewritten or original,
    notes=notes,
    provider="fallback",
    providerMessage=FALLBACK_PROVIDER_MESSAGE
  )


def rewrite_summary_deterministic(resume_content: dict, job_description: str) -> RewriteSummaryResult:
  original = (resume_content.get("summary") or "").strip()
  skills = [str(item).strip() for item in resume_content.get("skills", []) if str(item).strip()]
  top_keywords = extract_keywords(job_description, limit=6)

  base_summary = original or "Results-focused professional delivering reliable, role-aligned outcomes."

  highlights = [item for item in skills[:3] + top_keywords[:3] if item]
  if highlights:
    highlight_phrase = ", ".join(highlights)
    rewritten = (
      f"{base_summary.rstrip('.')} Skilled in {highlight_phrase}. "
      "Communicates impact clearly and aligns execution with role priorities."
    )
  else:
    rewritten = f"{base_summary.rstrip('.')} Focused on clear, measurable business impact."

  notes = [
    "Local fallback rewrite used; review wording and keep only true claims.",
    "Add measurable impact details where possible."
  ]

  return RewriteSummaryResult(
    originalSummary=original,
    rewrittenSummary=rewritten.strip(),
    notes=notes,
    provider="fallback",
    providerMessage=FALLBACK_PROVIDER_MESSAGE
  )


def score_resume_deterministic(resume_content: dict, job_description: str) -> ResumeScoreResult:
  data = compute_match_score(resume_content, job_description)
  return ResumeScoreResult(
    score=data["score"],
    matchedKeywords=data["matchedKeywords"],
    missingKeywords=data["missingKeywords"],
    suggestions=data["suggestions"],
    provider="fallback",
    providerMessage=FALLBACK_PROVIDER_MESSAGE
  )


class FallbackProvider:
  name = "fallback"

  def is_configured(self) -> bool:
    return True

  async def health_check(self) -> ProviderStatus:
    return ProviderStatus(
      provider=self.name,
      configured=True,
      available=True,
      healthy=True,
      detail="Deterministic local fallback is always available."
    )

  async def generate_text(self, prompt: str) -> str:
    prompt = prompt.strip()
    return prompt if prompt else "Fallback provider generated no text."

  async def chat(self, prompt: str, system_prompt: str | None = None) -> str:
    if system_prompt:
      return f"{system_prompt.strip()} {prompt.strip()}".strip()
    return await self.generate_text(prompt)

  async def embed(self, texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for text in texts:
      digest = hashlib.sha256(text.encode("utf-8")).digest()[:16]
      vectors.append([round(byte / 255, 6) for byte in digest])
    return vectors

  async def extract_keywords(self, job_description: str) -> KeywordExtractionResult:
    return KeywordExtractionResult(
      keywords=extract_keywords(job_description, limit=20),
      provider="fallback",
      providerMessage=FALLBACK_PROVIDER_MESSAGE
    )

  async def rewrite_summary(
    self,
    resume_content: dict,
    job_description: str
  ) -> RewriteSummaryResult:
    return rewrite_summary_deterministic(resume_content, job_description)

  async def rewrite_bullet(
    self,
    bullet: str,
    job_description: str,
    role_context: str = ""
  ) -> RewriteBulletResult:
    return rewrite_bullet_deterministic(bullet, job_description, role_context)

  async def score_resume(self, resume_content: dict, job_description: str) -> ResumeScoreResult:
    return score_resume_deterministic(resume_content, job_description)

  async def suggest_improvements(
    self,
    resume_content: dict,
    job_description: str
  ) -> ImprovementSuggestionResult:
    base_score = score_resume_deterministic(resume_content, job_description)
    issues = section_quality_issues(resume_content)
    suggestions = [*base_score.suggestions, *issues]
    unique: list[str] = []
    seen: set[str] = set()
    for suggestion in suggestions:
      normalized = suggestion.lower().strip()
      if not normalized or normalized in seen:
        continue
      seen.add(normalized)
      unique.append(suggestion)
    return ImprovementSuggestionResult(
      suggestions=unique[:8],
      provider="fallback",
      providerMessage=FALLBACK_PROVIDER_MESSAGE
    )
