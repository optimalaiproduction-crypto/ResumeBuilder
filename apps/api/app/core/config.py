from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  app_name: str = "ResumeForge API"
  debug: bool = False
  api_prefix: str = "/api/v1"
  frontend_url: str = "http://localhost:3000,http://127.0.0.1:3000"

  # Local development defaults to SQLite; production can override via DATABASE_URL.
  database_url: str = "sqlite+pysqlite:///./dev_resumeforge.db"

  jwt_secret_key: str = "dev-secret"
  jwt_algorithm: str = "HS256"
  jwt_expire_minutes: int = 60 * 24 * 7
  password_reset_token_expire_minutes: int = 30
  firebase_project_id: str | None = Field(
    default=None,
    validation_alias=AliasChoices("FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  )

  smtp_host: str | None = None
  smtp_port: int = 587
  smtp_username: str | None = None
  smtp_password: str | None = None
  smtp_from_email: str | None = None
  smtp_from_name: str = "ResumeForge"
  smtp_reply_to: str | None = None
  smtp_use_tls: bool = True
  smtp_use_ssl: bool = False
  smtp_timeout_seconds: int = 20

  # Optional HTTPS transactional email provider for environments that block SMTP.
  brevo_api_key: str | None = None
  brevo_sender_email: str | None = None
  brevo_sender_name: str = "ResumeForge"
  brevo_reply_to: str | None = None
  brevo_base_url: str = "https://api.brevo.com"

  ai_provider_mode: Literal["openai", "anthropic", "ollama", "fallback", "auto"] = Field(
    default="auto",
    validation_alias=AliasChoices("AI_PROVIDER_MODE", "AI_PROVIDER")
  )
  openai_api_key: str | None = None
  openai_model: str = "gpt-4o-mini"
  anthropic_api_key: str | None = None
  anthropic_model: str = "claude-3-5-sonnet-latest"
  ollama_base_url: str = "http://localhost:11434"
  ollama_model: str = "llama3.1:8b"
  ollama_embed_model: str = "nomic-embed-text"
  ollama_keep_alive: str = "5m"
  ai_request_timeout_ms: int = 30000
  ai_max_retries: int = 1

  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    case_sensitive=False,
    extra="ignore"
  )

  @field_validator("debug", mode="before")
  @classmethod
  def parse_debug(cls, value):
    if isinstance(value, bool):
      return value
    if isinstance(value, str):
      value = value.strip().lower()
      if value in {"1", "true", "yes", "on", "dev", "debug", "development"}:
        return True
      if value in {"0", "false", "no", "off", "prod", "production", "release"}:
        return False
    return bool(value)

  @property
  def ai_provider(self) -> str:
    # Backward-compatible alias for older call sites.
    return self.ai_provider_mode


@lru_cache
def get_settings() -> Settings:
  return Settings()
