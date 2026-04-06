from anthropic import AsyncAnthropic

from app.core.config import Settings
from app.services.ai.base import MatchSuggestionSet, fallback_suggestions, parse_suggestions


class AnthropicProvider:
  name = "anthropic"

  def __init__(self, settings: Settings):
    self.settings = settings
    self.client = AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

  async def suggest(self, resume_text: str, job_description: str) -> MatchSuggestionSet:
    if self.client is None:
      return MatchSuggestionSet(provider_name=self.name, suggestions=fallback_suggestions(job_description))

    prompt = (
      "You are a resume coach. Return concise bullet suggestions to improve resume-job fit.\n\n"
      f"Resume:\n{resume_text}\n\nJob description:\n{job_description}\n\n"
      "Give 5 to 8 bullets."
    )

    try:
      message = await self.client.messages.create(
        model=self.settings.anthropic_model,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
      )

      chunks: list[str] = []
      for block in message.content:
        if getattr(block, "type", "") == "text":
          chunks.append(block.text)

      suggestions = parse_suggestions("\n".join(chunks)) or fallback_suggestions(job_description)
      return MatchSuggestionSet(provider_name=self.name, suggestions=suggestions)
    except Exception:
      return MatchSuggestionSet(provider_name=self.name, suggestions=fallback_suggestions(job_description))
