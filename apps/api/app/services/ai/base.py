from typing import Protocol

from app.services.ai.types import (
  ImprovementSuggestionResult,
  KeywordExtractionResult,
  ProviderStatus,
  ResumeScoreResult,
  RewriteBulletResult,
  RewriteSummaryResult
)


class AIProvider(Protocol):
  name: str

  def is_configured(self) -> bool:
    ...

  async def health_check(self) -> ProviderStatus:
    ...

  async def generate_text(self, prompt: str) -> str:
    ...

  async def chat(self, prompt: str, system_prompt: str | None = None) -> str:
    ...

  async def embed(self, texts: list[str]) -> list[list[float]]:
    ...

  async def extract_keywords(self, job_description: str) -> KeywordExtractionResult:
    ...

  async def rewrite_summary(
    self,
    resume_content: dict,
    job_description: str
  ) -> RewriteSummaryResult:
    ...

  async def rewrite_bullet(
    self,
    bullet: str,
    job_description: str,
    role_context: str = ""
  ) -> RewriteBulletResult:
    ...

  async def score_resume(self, resume_content: dict, job_description: str) -> ResumeScoreResult:
    ...

  async def suggest_improvements(
    self,
    resume_content: dict,
    job_description: str
  ) -> ImprovementSuggestionResult:
    ...
