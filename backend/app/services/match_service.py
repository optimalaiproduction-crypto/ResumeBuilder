from app.schemas.match import MatchResponse
from app.schemas.resume import ResumeContent
from app.services.ai.factory import AIOrchestrator


def resume_to_text(content: ResumeContent) -> str:
  sections: list[str] = [
    f"Name: {content.full_name}",
    f"Summary: {content.summary}",
    "Skills: " + ", ".join(content.skills),
    "Experience:\n" + "\n".join(content.experience),
    "Education:\n" + "\n".join(content.education)
  ]
  return "\n\n".join(sections)


def score_from_suggestions(suggestions: list[str]) -> int:
  # Lower suggestion count often means stronger fit; keep within sensible range.
  return max(50, min(96, 100 - len(suggestions) * 6))


async def run_resume_match(
  content: ResumeContent,
  job_description: str,
  orchestrator: AIOrchestrator
) -> MatchResponse:
  resume_text = resume_to_text(content)
  suggestion_set = await orchestrator.suggest(resume_text, job_description)
  score = score_from_suggestions(suggestion_set.suggestions)
  return MatchResponse(
    score=score,
    provider_used=suggestion_set.provider_name,
    suggestions=suggestion_set.suggestions
  )
