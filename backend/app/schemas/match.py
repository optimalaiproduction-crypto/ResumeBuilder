from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
  job_description: str = Field(min_length=20, max_length=15000)


class MatchResponse(BaseModel):
  score: int = Field(ge=0, le=100)
  provider_used: str
  suggestions: list[str]
