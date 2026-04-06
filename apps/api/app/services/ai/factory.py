import logging
import time
from functools import lru_cache
from typing import Awaitable, Callable, TypeVar

from app.core.config import Settings, get_settings
from app.services.ai.base import AIProvider
from app.services.ai.providers import AnthropicProvider, FallbackProvider, OllamaProvider, OpenAIProvider
from app.services.ai.types import (
  ImprovementSuggestionResult,
  KeywordExtractionResult,
  ProviderStatus,
  ProviderStatusResponse,
  ResumeScoreResult,
  RewriteBulletResult,
  RewriteSummaryResult
)

logger = logging.getLogger(__name__)
T = TypeVar("T")


class AIService:
  def __init__(self, settings: Settings, providers: dict[str, AIProvider]):
    self.settings = settings
    self.providers = providers
    self._health_cache: dict[str, tuple[float, ProviderStatus]] = {}
    self._health_cache_ttl_seconds = 20.0

  def _chain_for_mode(self) -> list[str]:
    mode = self.settings.ai_provider_mode
    if mode == "openai":
      return ["openai", "fallback"]
    if mode == "anthropic":
      return ["anthropic", "fallback"]
    if mode == "ollama":
      return ["ollama", "fallback"]
    if mode == "fallback":
      return ["fallback"]
    return ["openai", "anthropic", "ollama", "fallback"]

  async def _get_provider_health(
    self,
    provider_name: str,
    provider: AIProvider,
    force_refresh: bool = False
  ) -> ProviderStatus:
    now = time.time()
    cached = self._health_cache.get(provider_name)
    if not force_refresh and cached:
      timestamp, status = cached
      if (now - timestamp) < self._health_cache_ttl_seconds:
        return status

    status = await provider.health_check()
    self._health_cache[provider_name] = (now, status)
    return status

  async def _provider_ready(self, provider_name: str, provider: AIProvider) -> tuple[bool, ProviderStatus]:
    status = await self._get_provider_health(provider_name, provider)
    if provider_name == "fallback":
      return True, status
    if not provider.is_configured():
      return False, status
    return status.healthy, status

  async def _run_chain(self, operation_name: str, op: Callable[[AIProvider], Awaitable[T]]) -> T:
    fallback = self.providers["fallback"]
    chain = self._chain_for_mode()
    attempted: list[str] = []

    for provider_name in chain:
      provider = self.providers[provider_name]
      ready, status = await self._provider_ready(provider_name, provider)
      if not ready:
        logger.info(
          "AI provider skipped | operation=%s provider=%s configured=%s healthy=%s detail=%s",
          operation_name,
          provider_name,
          status.configured,
          status.healthy,
          status.detail
        )
        continue

      attempted.append(provider_name)
      try:
        result = await op(provider)
        logger.info("AI provider success | operation=%s provider=%s", operation_name, provider_name)
        return result
      except Exception as exc:
        logger.warning("AI provider failed | operation=%s provider=%s error=%s", operation_name, provider_name, exc)
        continue

    if "fallback" not in attempted:
      logger.warning("No live AI provider available for %s. Falling back to deterministic mode.", operation_name)
      return await op(fallback)

    raise RuntimeError(f"AI request failed for operation '{operation_name}' across chain: {chain}")

  async def extract_keywords(self, job_description: str) -> KeywordExtractionResult:
    return await self._run_chain("extract_keywords", lambda provider: provider.extract_keywords(job_description))

  async def rewrite_summary(self, resume_content: dict, job_description: str) -> RewriteSummaryResult:
    return await self._run_chain(
      "rewrite_summary",
      lambda provider: provider.rewrite_summary(resume_content, job_description)
    )

  async def rewrite_bullet(self, bullet: str, job_description: str, role_context: str = "") -> RewriteBulletResult:
    return await self._run_chain(
      "rewrite_bullet",
      lambda provider: provider.rewrite_bullet(bullet, job_description, role_context)
    )

  async def score_resume(self, resume_content: dict, job_description: str) -> ResumeScoreResult:
    return await self._run_chain("score_resume", lambda provider: provider.score_resume(resume_content, job_description))

  async def suggest_improvements(self, resume_content: dict, job_description: str) -> ImprovementSuggestionResult:
    return await self._run_chain(
      "suggest_improvements",
      lambda provider: provider.suggest_improvements(resume_content, job_description)
    )

  async def provider_status(self) -> ProviderStatusResponse:
    chain = self._chain_for_mode()
    ordered = ["openai", "anthropic", "ollama", "fallback"]
    statuses: list[ProviderStatus] = []
    for provider_name in ordered:
      provider = self.providers[provider_name]
      try:
        statuses.append(await self._get_provider_health(provider_name, provider, force_refresh=True))
      except Exception as exc:
        statuses.append(
          ProviderStatus(
            provider=provider_name,
            configured=provider.is_configured(),
            available=False,
            healthy=False,
            detail=f"Health check failed: {exc}"
          )
        )
    return ProviderStatusResponse(mode=self.settings.ai_provider_mode, chain=chain, providers=statuses)


@lru_cache
def get_ai_service() -> AIService:
  settings: Settings = get_settings()
  providers: dict[str, AIProvider] = {
    "openai": OpenAIProvider(settings),
    "anthropic": AnthropicProvider(settings),
    "ollama": OllamaProvider(settings),
    "fallback": FallbackProvider()
  }
  return AIService(settings=settings, providers=providers)
