import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models.user import User

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


def normalize_email(value: str) -> str:
  return value.strip().lower()


def try_decode_internal_access_token(token: str, settings: Settings) -> dict | None:
  try:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
  except JWTError:
    return None


def decode_firebase_token(token: str, settings: Settings) -> dict:
  project_id = (settings.firebase_project_id or "").strip()
  if not project_id:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Firebase authentication is not configured."
    )

  try:
    claims = google_id_token.verify_firebase_token(
      token,
      GoogleAuthRequest(),
      audience=project_id
    )
  except Exception as exc:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid authentication token."
    ) from exc

  if not claims:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid authentication token."
    )
  return claims


def sync_user_from_firebase_claims(db: Session, claims: dict) -> User:
  firebase_uid = str(claims.get("uid") or claims.get("sub") or "").strip()
  if not firebase_uid:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token subject."
    )

  email = normalize_email(str(claims.get("email") or ""))
  if not email:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Email is required for this account."
    )

  display_name_raw = str(claims.get("name") or "").strip()
  display_name = " ".join(display_name_raw.split()) if display_name_raw else None

  user = db.scalar(select(User).where(User.firebase_uid == firebase_uid))
  if not user:
    user = db.scalar(select(User).where(func.lower(User.email) == email))

  if not user:
    user = User(
      email=email,
      full_name=display_name,
      firebase_uid=firebase_uid,
      # Keep legacy schema compatibility where password_hash is required.
      password_hash=hash_password(secrets.token_urlsafe(32))
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

  changed = False
  if user.firebase_uid != firebase_uid:
    user.firebase_uid = firebase_uid
    changed = True
  if user.email != email:
    user.email = email
    changed = True
  if display_name and user.full_name != display_name:
    user.full_name = display_name
    changed = True

  if changed:
    db.commit()
    db.refresh(user)

  return user


def get_current_user_id(
  token: str = Depends(oauth2_scheme),
  settings: Settings = Depends(get_settings),
  db: Session = Depends(get_db)
) -> str:
  # Backward compatibility: accept legacy backend JWTs first.
  internal_payload = try_decode_internal_access_token(token, settings)
  if internal_payload is not None:
    subject = internal_payload.get("sub")
    if not subject:
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")
    return str(subject)

  # Preferred production mode: Firebase ID token issued by client SDK.
  firebase_claims = decode_firebase_token(token, settings)
  user = sync_user_from_firebase_claims(db, firebase_claims)
  return str(user.id)
