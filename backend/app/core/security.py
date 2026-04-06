from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
  credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
  settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
  if not settings.require_auth:
    return {"sub": "demo-user", "provider": settings.auth_provider}

  if credentials is None or not credentials.credentials:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Missing bearer token."
    )

  # Hook point:
  # - Clerk: verify JWT against Clerk JWKS and extract user id.
  # - Auth.js: verify your session/JWT and extract subject.
  return {"sub": "verified-user", "provider": settings.auth_provider}
