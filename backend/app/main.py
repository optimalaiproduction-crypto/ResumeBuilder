from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models.resume import Resume  # noqa: F401
from app.routers.health import router as health_router
from app.routers.resumes import router as resumes_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
  async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.cors_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
