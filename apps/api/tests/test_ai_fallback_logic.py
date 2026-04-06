from app.services.ai.providers.fallback import (
  rewrite_bullet_deterministic,
  rewrite_summary_deterministic,
  score_resume_deterministic
)
from app.utils.keywords import compute_match_score, extract_keywords


def sample_resume_content():
  return {
    "basics": {
      "fullName": "Alex Doe",
      "email": "alex@example.com",
      "phone": "",
      "location": "Remote",
      "linkedin": ""
    },
    "summary": "",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "workExperience": [
      {
        "company": "Acme",
        "title": "Engineer",
        "bullets": ["responsible for backend APIs"]
      }
    ],
    "education": [],
    "projects": [],
    "certifications": []
  }


def test_deterministic_keyword_extraction_returns_ranked_unique_keywords():
  text = "Python FastAPI backend engineer with Docker, REST API design, PostgreSQL and CI/CD experience."
  keywords = extract_keywords(text, limit=10)
  lowered = [item.lower() for item in keywords]
  assert "python" in lowered
  assert "fastapi" in lowered
  assert len(lowered) == len(set(lowered))


def test_deterministic_match_scoring_returns_expected_shape():
  resume = sample_resume_content()
  jd = "Looking for Python, FastAPI, PostgreSQL, Docker and REST API experience."
  result = compute_match_score(resume, jd)
  assert {"score", "matchedKeywords", "missingKeywords", "suggestions"} <= set(result.keys())
  assert isinstance(result["score"], int)
  assert isinstance(result["matchedKeywords"], list)
  assert isinstance(result["missingKeywords"], list)
  assert isinstance(result["suggestions"], list)


def test_deterministic_bullet_rewrite_is_conservative_and_structured():
  result = rewrite_bullet_deterministic(
    bullet="responsible for backend APIs",
    job_description="Need Python FastAPI and Docker experience",
    role_context="Backend engineer"
  )
  assert result.provider == "fallback"
  assert result.originalBullet == "responsible for backend APIs"
  assert result.rewrittenBullet
  assert result.rewrittenBullet.endswith(".")
  assert isinstance(result.notes, list)


def test_deterministic_summary_rewrite_returns_expected_shape():
  result = rewrite_summary_deterministic(
    resume_content=sample_resume_content(),
    job_description="Need Python, FastAPI, PostgreSQL experience"
  )
  assert result.provider == "fallback"
  assert isinstance(result.rewrittenSummary, str)
  assert result.rewrittenSummary.strip() != ""


def test_score_resume_deterministic_sets_provider_and_lists():
  result = score_resume_deterministic(
    resume_content=sample_resume_content(),
    job_description="Need Python, FastAPI, Docker and metrics-driven impact"
  )
  assert result.provider == "fallback"
  assert isinstance(result.score, int)
  assert isinstance(result.matchedKeywords, list)
  assert isinstance(result.missingKeywords, list)
  assert isinstance(result.suggestions, list)
