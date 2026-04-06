from pydantic import BaseModel, Field


class ProviderMeta(BaseModel):
  provider: str = "fallback"
  providerMessage: str | None = None


class KeywordExtractionResult(ProviderMeta):
  keywords: list[str] = Field(default_factory=list)


class RewriteSummaryResult(ProviderMeta):
  originalSummary: str
  rewrittenSummary: str
  notes: list[str] = Field(default_factory=list)


class RewriteBulletResult(ProviderMeta):
  originalBullet: str
  rewrittenBullet: str
  notes: list[str] = Field(default_factory=list)


class ResumeScoreResult(ProviderMeta):
  score: int = Field(ge=0, le=100)
  matchedKeywords: list[str] = Field(default_factory=list)
  missingKeywords: list[str] = Field(default_factory=list)
  suggestions: list[str] = Field(default_factory=list)


class ImprovementSuggestionResult(ProviderMeta):
  suggestions: list[str] = Field(default_factory=list)


class ProviderStatus(BaseModel):
  provider: str
  configured: bool
  available: bool
  healthy: bool
  model: str | None = None
  baseUrl: str | None = None
  detail: str | None = None


class ProviderStatusResponse(BaseModel):
  mode: str
  chain: list[str] = Field(default_factory=list)
  providers: list[ProviderStatus] = Field(default_factory=list)
