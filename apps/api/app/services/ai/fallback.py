from app.services.ai.providers.fallback import (
  FALLBACK_PROVIDER_MESSAGE,
  rewrite_bullet_deterministic as fallback_rewrite_bullet,
  rewrite_summary_deterministic as fallback_rewrite_summary,
  score_resume_deterministic as fallback_score_resume
)
from app.services.ai.types import ImprovementSuggestionResult, KeywordExtractionResult
from app.utils.keywords import extract_keywords


def fallback_extract_keywords(job_description: str) -> KeywordExtractionResult:
  return KeywordExtractionResult(
    keywords=extract_keywords(job_description, limit=20),
    provider="fallback",
    providerMessage=FALLBACK_PROVIDER_MESSAGE
  )


def fallback_improvements(resume_content: dict, job_description: str) -> ImprovementSuggestionResult:
  score = fallback_score_resume(resume_content, job_description)
  return ImprovementSuggestionResult(
    suggestions=score.suggestions,
    provider="fallback",
    providerMessage=FALLBACK_PROVIDER_MESSAGE
  )
