from openai import AsyncOpenAI

from app.core.config import Settings
from app.services.ai.base import MatchSuggestionSet, fallback_suggestions, parse_suggestions


class OpenAIProvider:
  name = "openai"

  def __init__(self, settings: Settings):
    self.settings = settings
    self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

  async def suggest(self, resume_text: str, job_description: str) -> MatchSuggestionSet:
    if self.client is None:
      return MatchSuggestionSet(provider_name=self.name, suggestions=fallback_suggestions(job_description))

    prompt = (
      "You are a resume coach. Return concise bullet suggestions to improve resume-job fit.\n\n"
      f"Resume:\n{resume_text}\n\nJob description:\n{job_description}\n\n"
      "Give 5 to 8 bullets."
    )

    try:
      response = await self.client.responses.create(
        model=self.settings.openai_model,
        input=prompt
      )
      text = (response.output_text or "").strip()
      suggestions = parse_suggestions(text) or fallback_suggestions(job_description)
      return MatchSuggestionSet(provider_name=self.name, suggestions=suggestions)
    except Exception:
      return MatchSuggestionSet(provider_name=self.name, suggestions=fallback_suggestions(job_description))
