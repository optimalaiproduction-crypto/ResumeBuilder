from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  app_name: str = "Resume Builder API"
  debug: bool = True
  cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

  database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/resume_builder"

  auth_provider: Literal["clerk", "authjs"] = "clerk"
  require_auth: bool = False

  openai_api_key: str | None = None
  openai_model: str = "gpt-4o-mini"

  anthropic_api_key: str | None = None
  anthropic_model: str = "claude-3-5-sonnet-latest"

  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    extra="ignore"
  )

  @field_validator("debug", mode="before")
  @classmethod
  def parse_debug(cls, value):
    if isinstance(value, bool):
      return value
    if isinstance(value, str):
      lowered = value.strip().lower()
      if lowered in {"1", "true", "yes", "on", "debug", "dev", "development"}:
        return True
      if lowered in {"0", "false", "no", "off", "release", "prod", "production"}:
        return False
    return bool(value)


@lru_cache
def get_settings() -> Settings:
  return Settings()
