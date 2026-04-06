from pydantic import BaseModel, Field

from app.schemas.resume import ResumeContentSchema


class ExtractKeywordsRequest(BaseModel):
  jobDescription: str = Field(min_length=20, max_length=20000)


class ExtractKeywordsResponse(BaseModel):
  keywords: list[str]
  provider: str = "fallback"
  providerMessage: str | None = None


class RewriteSummaryRequest(BaseModel):
  resume: ResumeContentSchema
  jobDescription: str = Field(min_length=20, max_length=20000)


class RewriteSummaryResponse(BaseModel):
  originalSummary: str
  rewrittenSummary: str
  notes: list[str] = Field(default_factory=list)
  provider: str = "fallback"
  providerMessage: str | None = None


class RewriteBulletRequest(BaseModel):
  bullet: str = Field(min_length=3, max_length=500)
  jobDescription: str = Field(min_length=20, max_length=20000)
  roleContext: str = ""


class RewriteBulletResponse(BaseModel):
  originalBullet: str
  rewrittenBullet: str
  notes: list[str] = Field(default_factory=list)
  provider: str = "fallback"
  providerMessage: str | None = None


class ScoreResumeRequest(BaseModel):
  resume: ResumeContentSchema
  jobDescription: str = Field(min_length=20, max_length=20000)
  resumeId: str | None = None


class ScoreResumeResponse(BaseModel):
  score: int = Field(ge=0, le=100)
  matchedKeywords: list[str] = Field(default_factory=list)
  missingKeywords: list[str] = Field(default_factory=list)
  suggestions: list[str] = Field(default_factory=list)
  provider: str = "fallback"
  providerMessage: str | None = None


class ProviderStatusSchema(BaseModel):
  provider: str
  configured: bool
  available: bool
  healthy: bool
  model: str | None = None
  baseUrl: str | None = None
  detail: str | None = None


class ProviderStatusResponseSchema(BaseModel):
  mode: str
  chain: list[str] = Field(default_factory=list)
  providers: list[ProviderStatusSchema] = Field(default_factory=list)
