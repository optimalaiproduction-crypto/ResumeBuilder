import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import LoginEvent, PasswordResetToken, User
from app.schemas.auth import (
  AuthResponse,
  AuthUserProfile,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse
)
from app.services.email_service import send_password_reset_email, smtp_configured

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

FORGOT_PASSWORD_MESSAGE = (
  "If an account exists for this email, a password reset link will be sent."
)
FORGOT_PASSWORD_UNAVAILABLE_MESSAGE = "Password reset is temporarily unavailable. Please try again later."
RESET_PASSWORD_SUCCESS_MESSAGE = "Your password has been reset successfully."
INVALID_OR_EXPIRED_RESET_TOKEN_MESSAGE = "Invalid or expired reset token."


def auth_response_for_user(user: User, token: str) -> AuthResponse:
  profile = AuthUserProfile(
    id=user.id,
    email=user.email,
    full_name=user.full_name,
    created_at=user.created_at
  )
  return AuthResponse(
    access_token=token,
    user_id=user.id,
    email=user.email,
    full_name=user.full_name,
    user=profile
  )


def normalize_email(value: str) -> str:
  return value.strip().lower()


def find_user_by_email(db: Session, email: str) -> User | None:
  return db.scalar(select(User).where(func.lower(User.email) == email))


def hash_reset_token(token: str, settings: Settings) -> str:
  # Pepper with JWT secret so leaked DB hashes cannot be used directly.
  payload = f"{settings.jwt_secret_key}:{token}".encode("utf-8")
  return hashlib.sha256(payload).hexdigest()


def primary_frontend_origin(settings: Settings) -> str:
  first_origin = settings.frontend_url.split(",")[0].strip().rstrip("/")
  return first_origin or "http://localhost:3000"


def local_frontend_mode(settings: Settings) -> bool:
  origins = [origin.strip().lower() for origin in settings.frontend_url.split(",") if origin.strip()]
  if not origins:
    return True
  localhost_prefixes = (
    "http://localhost",
    "https://localhost",
    "http://127.0.0.1",
    "https://127.0.0.1",
    "http://0.0.0.0",
    "https://0.0.0.0",
  )
  return all(origin.startswith(localhost_prefixes) for origin in origins)


def should_expose_dev_reset_token(settings: Settings) -> bool:
  # Local development fallback: allow direct reset flow when SMTP is unavailable.
  return settings.debug or local_frontend_mode(settings)


def to_utc(dt: datetime) -> datetime:
  if dt.tzinfo is None:
    return dt.replace(tzinfo=timezone.utc)
  return dt.astimezone(timezone.utc)


@router.post("/register", response_model=AuthResponse)
def register(
  payload: RegisterRequest,
  db: Session = Depends(get_db),
  settings: Settings = Depends(get_settings)
):
  normalized_email = normalize_email(str(payload.email))
  exists = find_user_by_email(db, normalized_email)
  if exists:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

  user = User(
    email=normalized_email,
    full_name=payload.full_name,
    password_hash=hash_password(payload.password)
  )
  db.add(user)
  db.commit()
  db.refresh(user)

  token = create_access_token(subject=user.id, settings=settings)
  return auth_response_for_user(user, token)


@router.post("/login", response_model=AuthResponse)
def login(
  payload: LoginRequest,
  request: Request,
  db: Session = Depends(get_db),
  settings: Settings = Depends(get_settings)
):
  normalized_email = normalize_email(str(payload.email))
  user = find_user_by_email(db, normalized_email)
  if not user or not verify_password(payload.password, user.password_hash):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

  ip_address = request.client.host if request.client and request.client.host else ""
  user_agent = request.headers.get("user-agent", "")[:512]
  db.add(
    LoginEvent(
      user_id=user.id,
      email=user.email,
      ip_address=ip_address,
      user_agent=user_agent
    )
  )
  db.commit()

  token = create_access_token(subject=user.id, settings=settings)
  return auth_response_for_user(user, token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
  payload: ForgotPasswordRequest,
  db: Session = Depends(get_db),
  settings: Settings = Depends(get_settings)
):
  now = datetime.now(timezone.utc)
  email = normalize_email(str(payload.email))
  user = find_user_by_email(db, email)
  expose_dev_token = should_expose_dev_reset_token(settings)
  smtp_ready = smtp_configured(settings)
  dev_reset_token: str | None = None

  if user:
    db.execute(
      update(PasswordResetToken)
      .where(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None)
      )
      .values(used_at=now)
    )

    raw_token = secrets.token_urlsafe(40)
    token_hash = hash_reset_token(raw_token, settings)
    expires_at = now + timedelta(minutes=settings.password_reset_token_expire_minutes)
    db.add(
      PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
      )
    )
    db.commit()

    reset_url = f"{primary_frontend_origin(settings)}/reset-password?token={raw_token}"
    logger.info("Password reset requested for %s (expires in %s minutes)", user.email, settings.password_reset_token_expire_minutes)
    email_sent = False
    if smtp_ready:
      email_sent = send_password_reset_email(
        settings=settings,
        to_email=user.email,
        reset_url=reset_url,
        expire_minutes=settings.password_reset_token_expire_minutes,
      )
      if email_sent:
        logger.info("Password reset email sent to %s", user.email)
    if not smtp_ready and expose_dev_token:
      dev_reset_token = raw_token
      logger.warning("SMTP is not configured. Using local password reset flow.")
    elif not email_sent and expose_dev_token:
      dev_reset_token = raw_token
      logger.warning("Password reset email delivery failed. Using local password reset flow.")
    else:
      if not smtp_ready or not email_sent:
        logger.warning("Password reset unavailable for %s.", user.email)
        raise HTTPException(
          status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
          detail=FORGOT_PASSWORD_UNAVAILABLE_MESSAGE
        )

  return ForgotPasswordResponse(
    message=FORGOT_PASSWORD_MESSAGE,
    dev_reset_token=dev_reset_token
  )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
  payload: ResetPasswordRequest,
  db: Session = Depends(get_db),
  settings: Settings = Depends(get_settings)
):
  now = datetime.now(timezone.utc)
  token_hash = hash_reset_token(payload.token, settings)

  reset_token = db.scalar(
    select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
  )
  if not reset_token or reset_token.used_at is not None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_OR_EXPIRED_RESET_TOKEN_MESSAGE)

  if to_utc(reset_token.expires_at) <= now:
    reset_token.used_at = now
    db.commit()
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_OR_EXPIRED_RESET_TOKEN_MESSAGE)

  user = db.get(User, reset_token.user_id)
  if not user:
    reset_token.used_at = now
    db.commit()
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_OR_EXPIRED_RESET_TOKEN_MESSAGE)

  user.password_hash = hash_password(payload.new_password)
  reset_token.used_at = now
  db.execute(
    update(PasswordResetToken)
    .where(
      PasswordResetToken.user_id == user.id,
      PasswordResetToken.id != reset_token.id,
      PasswordResetToken.used_at.is_(None)
    )
    .values(used_at=now)
  )
  db.commit()

  return ResetPasswordResponse(message=RESET_PASSWORD_SUCCESS_MESSAGE)
