from app.core.config import Settings
from app.services.ai.anthropic_provider import AnthropicProvider
from app.services.ai.base import AIProvider, MatchSuggestionSet, fallback_suggestions
from app.services.ai.openai_provider import OpenAIProvider


class AIOrchestrator:
  def __init__(self, providers: list[AIProvider]):
    self.providers = providers

  async def suggest(self, resume_text: str, job_description: str) -> MatchSuggestionSet:
    for provider in self.providers:
      result = await provider.suggest(resume_text, job_description)
      if result.suggestions:
        return result

    return MatchSuggestionSet("heuristic", fallback_suggestions(job_description))


def build_ai_orchestrator(settings: Settings) -> AIOrchestrator:
  providers: list[AIProvider] = [
    OpenAIProvider(settings),
    AnthropicProvider(settings)
  ]
  return AIOrchestrator(providers)
