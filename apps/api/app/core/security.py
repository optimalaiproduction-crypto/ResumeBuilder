from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import Settings, get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
  return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
  return pwd_context.verify(password, hashed_password)


def create_access_token(
  subject: str,
  settings: Settings,
  expires_minutes: int | None = None
) -> str:
  expires_delta = timedelta(minutes=expires_minutes or settings.jwt_expire_minutes)
  expire = datetime.now(timezone.utc) + expires_delta
  payload = {"sub": subject, "exp": expire}
  return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: Settings) -> dict:
  try:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    return payload
  except JWTError as exc:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid authentication token."
    ) from exc


def get_current_user_id(
  token: str = Depends(oauth2_scheme),
  settings: Settings = Depends(get_settings)
) -> str:
  payload = decode_access_token(token, settings)
  subject = payload.get("sub")
  if not subject:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")
  return str(subject)
