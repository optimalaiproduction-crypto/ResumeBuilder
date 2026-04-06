from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid_str


class Resume(Base, TimestampMixin):
  __tablename__ = "resumes"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  title: Mapped[str] = mapped_column(String(180), nullable=False)
  content: Mapped[dict] = mapped_column(JSON, nullable=False)

  owner = relationship("User", back_populates="resumes")
  versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
  job_descriptions = relationship("JobDescription", back_populates="resume", cascade="all, delete-orphan")
  exports = relationship("ExportRecord", back_populates="resume", cascade="all, delete-orphan")


class JobDescription(Base, TimestampMixin):
  __tablename__ = "job_descriptions"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  resume_id: Mapped[str | None] = mapped_column(
    ForeignKey("resumes.id", ondelete="SET NULL"),
    nullable=True
  )
  text: Mapped[str] = mapped_column(Text, nullable=False)
  extracted_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

  resume = relationship("Resume", back_populates="job_descriptions")


class ResumeVersion(Base):
  __tablename__ = "resume_versions"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
  version_label: Mapped[str] = mapped_column(String(80), nullable=False, default="manual-update")
  content: Mapped[dict] = mapped_column(JSON, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  resume = relationship("Resume", back_populates="versions")


class ExportRecord(Base, TimestampMixin):
  __tablename__ = "exports"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
  user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
  format: Mapped[str] = mapped_column(String(10), nullable=False)
  status: Mapped[str] = mapped_column(String(30), nullable=False, default="completed")

  resume = relationship("Resume", back_populates="exports")
