from anthropic import AsyncAnthropic

from app.core.config import Settings
from app.services.ai.json_utils import parse_json_to_model
from app.services.ai.types import (
  ImprovementSuggestionResult,
  KeywordExtractionResult,
  ProviderStatus,
  ResumeScoreResult,
  RewriteBulletResult,
  RewriteSummaryResult
)


class AnthropicProvider:
  name = "anthropic"

  def __init__(self, settings: Settings):
    self.settings = settings
    self.client = AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

  def is_configured(self) -> bool:
    return bool(self.settings.anthropic_api_key)

  async def health_check(self) -> ProviderStatus:
    if self.client is None:
      return ProviderStatus(
        provider=self.name,
        configured=False,
        available=False,
        healthy=False,
        model=self.settings.anthropic_model,
        detail="ANTHROPIC_API_KEY is not configured."
      )
    try:
      await self.client.messages.create(
        model=self.settings.anthropic_model,
        max_tokens=10,
        messages=[{"role": "user", "content": "Respond with: ok"}]
      )
      return ProviderStatus(
        provider=self.name,
        configured=True,
        available=True,
        healthy=True,
        model=self.settings.anthropic_model
      )
    except Exception as exc:
      return ProviderStatus(
        provider=self.name,
        configured=True,
        available=False,
        healthy=False,
        model=self.settings.anthropic_model,
        detail=f"Anthropic health check failed: {exc}"
      )

  async def _call_json(self, prompt: str, schema_model):
    if self.client is None:
      raise RuntimeError("Anthropic key is not configured.")

    attempts = max(1, self.settings.ai_max_retries + 1)
    last_error: Exception | None = None
    for _attempt in range(attempts):
      try:
        message = await self.client.messages.create(
          model=self.settings.anthropic_model,
          max_tokens=900,
          messages=[{"role": "user", "content": prompt}]
        )
        chunks: list[str] = []
        for block in message.content:
          if getattr(block, "type", "") == "text":
            chunks.append(block.text)
        raw = "\n".join(chunks).strip()
        if not raw:
          raise RuntimeError("Anthropic returned empty response.")
        return parse_json_to_model(raw, schema_model)
      except Exception as exc:
        last_error = exc
    raise RuntimeError(f"Anthropic malformed response after retries: {last_error}")

  async def generate_text(self, prompt: str) -> str:
    if self.client is None:
      raise RuntimeError("Anthropic key is not configured.")
    message = await self.client.messages.create(
      model=self.settings.anthropic_model,
      max_tokens=800,
      messages=[{"role": "user", "content": prompt}]
    )
    chunks: list[str] = []
    for block in message.content:
      if getattr(block, "type", "") == "text":
        chunks.append(block.text)
    text = "\n".join(chunks).strip()
    if not text:
      raise RuntimeError("Anthropic returned empty text response.")
    return text

  async def chat(self, prompt: str, system_prompt: str | None = None) -> str:
    merged = f"{system_prompt.strip()}\n\n{prompt.strip()}" if system_prompt else prompt
    return await self.generate_text(merged)

  async def embed(self, texts: list[str]) -> list[list[float]]:
    raise RuntimeError("Anthropic embedding is not configured for this app.")

  async def extract_keywords(self, job_description: str) -> KeywordExtractionResult:
    prompt = (
      "Return JSON only with shape {\"keywords\": string[]}.\n"
      "Extract ATS keywords from this job description.\n"
      f"{job_description}"
    )
    result = await self._call_json(prompt, KeywordExtractionResult)
    result.provider = self.name
    result.providerMessage = None
    return result

  async def rewrite_summary(
    self,
    resume_content: dict,
    job_description: str
  ) -> RewriteSummaryResult:
    prompt = (
      "Return JSON only with shape "
      "{\"originalSummary\": string, \"rewrittenSummary\": string, \"notes\": string[]}.\n"
      "Rewrite the summary for ATS alignment while preserving factual accuracy.\n"
      "Do not invent companies, dates, tools, metrics, or achievements.\n"
      f"Resume content JSON:\n{resume_content}\n\n"
      f"Job description:\n{job_description}"
    )
    result = await self._call_json(prompt, RewriteSummaryResult)
    result.provider = self.name
    result.providerMessage = None
    return result

  async def rewrite_bullet(
    self,
    bullet: str,
    job_description: str,
    role_context: str = ""
  ) -> RewriteBulletResult:
    prompt = (
      "Return JSON only with shape "
      "{\"originalBullet\": string, \"rewrittenBullet\": string, \"notes\": string[]}.\n"
      "Rewrite this work bullet for ATS alignment while preserving facts.\n"
      "Do not invent any new metrics, technologies, dates, or achievements.\n"
      f"Bullet: {bullet}\n"
      f"Role context: {role_context}\n"
      f"Job description: {job_description}"
    )
    result = await self._call_json(prompt, RewriteBulletResult)
    result.provider = self.name
    result.providerMessage = None
    return result

  async def score_resume(self, resume_content: dict, job_description: str) -> ResumeScoreResult:
    prompt = (
      "Return JSON only with shape "
      "{\"score\": number, \"matchedKeywords\": string[], \"missingKeywords\": string[], \"suggestions\": string[]}.\n"
      "Score ATS alignment from 0 to 100 for this resume and job description.\n"
      "Provide conservative suggestions grounded in the provided data only.\n"
      f"Resume content JSON:\n{resume_content}\n\n"
      f"Job description:\n{job_description}"
    )
    result = await self._call_json(prompt, ResumeScoreResult)
    result.provider = self.name
    result.providerMessage = None
    return result

  async def suggest_improvements(
    self,
    resume_content: dict,
    job_description: str
  ) -> ImprovementSuggestionResult:
    prompt = (
      "Return JSON only with shape {\"suggestions\": string[]}.\n"
      "Provide 3-8 actionable ATS improvement suggestions without inventing facts.\n"
      f"Resume content JSON:\n{resume_content}\n\n"
      f"Job description:\n{job_description}"
    )
    result = await self._call_json(prompt, ImprovementSuggestionResult)
    result.provider = self.name
    result.providerMessage = None
    return result
