from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid_str


class User(Base, TimestampMixin):
  __tablename__ = "users"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True, index=True)
  email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
  full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
  password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

  resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
  login_events = relationship("LoginEvent", back_populates="user", cascade="all, delete-orphan")
  password_reset_tokens = relationship(
    "PasswordResetToken",
    back_populates="user",
    cascade="all, delete-orphan"
  )


class LoginEvent(Base):
  __tablename__ = "login_events"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
  email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
  ip_address: Mapped[str] = mapped_column(String(64), nullable=False, default="")
  user_agent: Mapped[str] = mapped_column(String(512), nullable=False, default="")
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

  user = relationship("User", back_populates="login_events")


class PasswordResetToken(Base):
  __tablename__ = "password_reset_tokens"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
  token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
  expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
  used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

  user = relationship("User", back_populates="password_reset_tokens")
