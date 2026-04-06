import pytest

from app.core.config import Settings
from app.services.ai.factory import AIService
from app.services.ai.providers.ollama import OllamaProvider
from app.services.ai.types import (
  ImprovementSuggestionResult,
  KeywordExtractionResult,
  ProviderStatus,
  ResumeScoreResult,
  RewriteBulletResult,
  RewriteSummaryResult
)


class FakeProvider:
  def __init__(self, name: str, configured: bool = True, healthy: bool = True):
    self.name = name
    self._configured = configured
    self._healthy = healthy
    self.calls: list[str] = []

  def is_configured(self) -> bool:
    return self._configured

  async def health_check(self) -> ProviderStatus:
    return ProviderStatus(
      provider=self.name,
      configured=self._configured,
      available=self._healthy,
      healthy=self._healthy,
      detail=None if self._healthy else "Provider unavailable"
    )

  async def generate_text(self, prompt: str) -> str:
    return prompt

  async def chat(self, prompt: str, system_prompt: str | None = None) -> str:
    return prompt if not system_prompt else f"{system_prompt} {prompt}"

  async def embed(self, texts: list[str]) -> list[list[float]]:
    return [[0.0] * 4 for _ in texts]

  async def extract_keywords(self, job_description: str) -> KeywordExtractionResult:
    self.calls.append("extract_keywords")
    return KeywordExtractionResult(keywords=[self.name], provider=self.name)

  async def rewrite_summary(self, resume_content: dict, job_description: str) -> RewriteSummaryResult:
    self.calls.append("rewrite_summary")
    return RewriteSummaryResult(
      originalSummary="a",
      rewrittenSummary=f"summary:{self.name}",
      notes=[],
      provider=self.name
    )

  async def rewrite_bullet(self, bullet: str, job_description: str, role_context: str = "") -> RewriteBulletResult:
    self.calls.append("rewrite_bullet")
    return RewriteBulletResult(
      originalBullet=bullet,
      rewrittenBullet=f"{bullet}:{self.name}",
      notes=[],
      provider=self.name
    )

  async def score_resume(self, resume_content: dict, job_description: str) -> ResumeScoreResult:
    self.calls.append("score_resume")
    return ResumeScoreResult(
      score=70,
      matchedKeywords=[],
      missingKeywords=[],
      suggestions=[],
      provider=self.name
    )

  async def suggest_improvements(self, resume_content: dict, job_description: str) -> ImprovementSuggestionResult:
    self.calls.append("suggest_improvements")
    return ImprovementSuggestionResult(suggestions=[f"suggest:{self.name}"], provider=self.name)


def make_service(mode: str, providers: dict[str, FakeProvider]) -> AIService:
  settings = Settings(ai_provider_mode=mode, ai_request_timeout_ms=200, ai_max_retries=0)
  return AIService(settings=settings, providers=providers)


@pytest.mark.asyncio
async def test_auto_mode_uses_openai_first_when_available():
  providers = {
    "openai": FakeProvider("openai", configured=True, healthy=True),
    "anthropic": FakeProvider("anthropic", configured=True, healthy=True),
    "ollama": FakeProvider("ollama", configured=True, healthy=True),
    "fallback": FakeProvider("fallback", configured=True, healthy=True)
  }
  service = make_service("auto", providers)
  result = await service.extract_keywords("python fastapi")
  assert result.provider == "openai"


@pytest.mark.asyncio
async def test_auto_mode_fallback_order_reaches_ollama():
  providers = {
    "openai": FakeProvider("openai", configured=True, healthy=False),
    "anthropic": FakeProvider("anthropic", configured=False, healthy=False),
    "ollama": FakeProvider("ollama", configured=True, healthy=True),
    "fallback": FakeProvider("fallback", configured=True, healthy=True)
  }
  service = make_service("auto", providers)
  result = await service.extract_keywords("python fastapi")
  assert result.provider == "ollama"


@pytest.mark.asyncio
async def test_ollama_unavailable_falls_back_to_deterministic_provider():
  providers = {
    "openai": FakeProvider("openai", configured=False, healthy=False),
    "anthropic": FakeProvider("anthropic", configured=False, healthy=False),
    "ollama": FakeProvider("ollama", configured=True, healthy=False),
    "fallback": FakeProvider("fallback", configured=True, healthy=True)
  }
  service = make_service("auto", providers)
  result = await service.extract_keywords("python fastapi")
  assert result.provider == "fallback"


@pytest.mark.asyncio
async def test_missing_model_like_ollama_failure_uses_fallback():
  providers = {
    "openai": FakeProvider("openai", configured=False, healthy=False),
    "anthropic": FakeProvider("anthropic", configured=False, healthy=False),
    "ollama": FakeProvider("ollama", configured=True, healthy=False),
    "fallback": FakeProvider("fallback", configured=True, healthy=True)
  }
  service = make_service("ollama", providers)
  result = await service.rewrite_bullet("worked on API", "python fastapi")
  assert result.provider == "fallback"


@pytest.mark.asyncio
async def test_ollama_missing_model_reports_unhealthy(monkeypatch):
  settings = Settings(
    ai_provider_mode="ollama",
    ollama_base_url="http://localhost:11434",
    ollama_model="llama3.1:8b",
    ai_request_timeout_ms=100,
    ai_max_retries=0
  )
  provider = OllamaProvider(settings)

  async def fake_tags():
    return {"models": [{"name": "other-model:latest"}]}

  monkeypatch.setattr(provider, "_tags", fake_tags)
  status = await provider.health_check()
  assert status.available is True
  assert status.healthy is False
  assert status.detail and "ollama pull" in status.detail.lower()
