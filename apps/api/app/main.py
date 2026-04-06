from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.export import router as export_router
from app.api.routes.health import router as health_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.templates import router as templates_router
from app.core.config import Settings, get_settings
from app.db.session import engine
from app.models.user import LoginEvent, PasswordResetToken

settings = get_settings()


def cors_origins(frontend_url: str) -> list[str]:
  origins: set[str] = set()
  for raw in frontend_url.split(","):
    origin = raw.strip().rstrip("/")
    if not origin:
      continue
    origins.add(origin)
    if "://localhost:" in origin:
      origins.add(origin.replace("://localhost:", "://127.0.0.1:"))
    if "://127.0.0.1:" in origin:
      origins.add(origin.replace("://127.0.0.1:", "://localhost:"))
  return sorted(origins)


def validate_runtime_settings(config: Settings) -> None:
  if config.debug:
    return

  weak_jwt_values = {"", "dev-secret", "change-this-in-local", "change-this-in-production"}
  normalized_secret = config.jwt_secret_key.strip()
  if normalized_secret in weak_jwt_values:
    raise RuntimeError(
      "Invalid production configuration: set a strong JWT_SECRET_KEY when DEBUG=false."
    )


validate_runtime_settings(settings)


@asynccontextmanager
async def lifespan(_app: FastAPI):
  # Keep login event tracking non-breaking on existing databases.
  LoginEvent.__table__.create(bind=engine, checkfirst=True)
  PasswordResetToken.__table__.create(bind=engine, checkfirst=True)
  yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=cors_origins(settings.frontend_url),
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(resumes_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)
app.include_router(export_router, prefix=settings.api_prefix)
app.include_router(templates_router, prefix=settings.api_prefix)
