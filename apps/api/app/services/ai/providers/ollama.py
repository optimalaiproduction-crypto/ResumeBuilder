from __future__ import annotations

import json

import httpx

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


class OllamaProvider:
  name = "ollama"

  def __init__(self, settings: Settings):
    self.settings = settings
    self.base_url = settings.ollama_base_url.rstrip("/")
    self.timeout_seconds = max(1, settings.ai_request_timeout_ms / 1000)
    self.max_attempts = max(1, settings.ai_max_retries + 1)

  def is_configured(self) -> bool:
    return bool(self.base_url and self.settings.ollama_model)

  async def _request(
    self,
    method: str,
    path: str,
    payload: dict | None = None,
    attempts: int | None = None
  ) -> dict:
    last_error: Exception | None = None
    max_attempts = attempts if attempts is not None else self.max_attempts
    max_attempts = max(1, max_attempts)
    for _attempt in range(max_attempts):
      try:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
          response = await client.request(method, f"{self.base_url}{path}", json=payload)
          if response.status_code >= 400:
            self._raise_ollama_error(response)
          data = response.json()
          if not isinstance(data, dict):
            raise RuntimeError("Ollama returned malformed JSON payload.")
          return data
      except Exception as exc:
        last_error = exc
    raise RuntimeError(f"Ollama request failed after retries: {last_error}")

  def _raise_ollama_error(self, response: httpx.Response) -> None:
    raw = response.text.strip()
    lowered = raw.lower()
    if "not found" in lowered and "model" in lowered:
      raise RuntimeError(
        f"Ollama model '{self.settings.ollama_model}' is not installed. Run: "
        f"ollama pull {self.settings.ollama_model}"
      )
    if "timed out" in lowered:
      raise RuntimeError("Ollama request timed out.")
    raise RuntimeError(f"Ollama API error ({response.status_code}): {raw or 'unknown error'}")

  async def _tags(self) -> dict:
    return await self._request("GET", "/api/tags", attempts=1)

  async def _model_exists(self, model_name: str, payload: dict) -> bool:
    models = payload.get("models", [])
    if not isinstance(models, list):
      return False
    normalized_target = model_name.lower()
    for model in models:
      name = str((model or {}).get("name", "")).lower()
      if name == normalized_target or name.startswith(f"{normalized_target}:"):
        return True
    return False

  async def health_check(self) -> ProviderStatus:
    if not self.is_configured():
      return ProviderStatus(
        provider=self.name,
        configured=False,
        available=False,
        healthy=False,
        model=self.settings.ollama_model,
        baseUrl=self.base_url,
        detail="OLLAMA_BASE_URL or OLLAMA_MODEL is missing."
      )

    try:
      payload = await self._tags()
    except Exception as exc:
      return ProviderStatus(
        provider=self.name,
        configured=True,
        available=False,
        healthy=False,
        model=self.settings.ollama_model,
        baseUrl=self.base_url,
        detail=f"Ollama unreachable: {exc}"
      )

    model_exists = await self._model_exists(self.settings.ollama_model, payload)
    detail = None
    if not model_exists:
      detail = f"Model '{self.settings.ollama_model}' not found. Run: ollama pull {self.settings.ollama_model}"

    return ProviderStatus(
      provider=self.name,
      configured=True,
      available=True,
      healthy=model_exists,
      model=self.settings.ollama_model,
      baseUrl=self.base_url,
      detail=detail
    )

  async def chat(self, prompt: str, system_prompt: str | None = None) -> str:
    messages = []
    if system_prompt:
      messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
      "model": self.settings.ollama_model,
      "messages": messages,
      "stream": False,
      "keep_alive": self.settings.ollama_keep_alive
    }
    data = await self._request("POST", "/api/chat", payload)
    message = data.get("message", {})
    content = str((message or {}).get("content", "")).strip()
    if not content:
      raise RuntimeError("Ollama returned empty chat response.")
    return content

  async def generate_text(self, prompt: str) -> str:
    payload = {
      "model": self.settings.ollama_model,
      "prompt": prompt,
      "stream": False,
      "keep_alive": self.settings.ollama_keep_alive
    }
    data = await self._request("POST", "/api/generate", payload)
    content = str(data.get("response", "")).strip()
    if not content:
      raise RuntimeError("Ollama returned empty generate response.")
    return content

  async def embed(self, texts: list[str]) -> list[list[float]]:
    payload = {
      "model": self.settings.ollama_embed_model,
      "input": texts
    }
    data = await self._request("POST", "/api/embed", payload)
    embeddings = data.get("embeddings")
    if isinstance(embeddings, list):
      return embeddings
    single = data.get("embedding")
    if isinstance(single, list):
      return [single]
    raise RuntimeError("Ollama returned malformed embed response.")

  async def _call_json(self, prompt: str, schema_model):
    system_prompt = (
      "You are a strict JSON response engine for ATS resume optimization. "
      "Return only valid JSON with the exact requested shape."
    )
    raw = await self.chat(prompt=prompt, system_prompt=system_prompt)
    raw = raw.strip()
    if raw.startswith("```"):
      raw = raw.strip("`")
      raw = raw.replace("json", "", 1).strip()
    try:
      return parse_json_to_model(raw, schema_model)
    except Exception:
      # Last attempt: parse if JSON object is wrapped with extra content.
      try:
        start = raw.index("{")
        end = raw.rindex("}") + 1
        parsed = json.loads(raw[start:end])
        return schema_model.model_validate(parsed)
      except Exception as exc:
        raise RuntimeError(f"Ollama malformed JSON response: {exc}")

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
