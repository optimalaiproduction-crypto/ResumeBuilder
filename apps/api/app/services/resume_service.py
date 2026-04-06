from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import ExportRecord, JobDescription, Resume, ResumeVersion


class ResumeService:
  def __init__(self, db: Session):
    self.db = db

  def list_resumes(self, user_id: str) -> list[Resume]:
    stmt = select(Resume).where(Resume.user_id == user_id).order_by(Resume.updated_at.desc())
    return list(self.db.scalars(stmt).all())

  def get_resume(self, resume_id: str, user_id: str) -> Resume:
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    resume = self.db.scalar(stmt)
    if not resume:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume

  def create_resume(self, user_id: str, title: str, content: dict) -> Resume:
    resume = Resume(user_id=user_id, title=title, content=content)
    self.db.add(resume)
    self.db.flush()
    self._save_version(resume.id, content, "initial")
    self.db.commit()
    self.db.refresh(resume)
    return resume

  def update_resume(self, resume_id: str, user_id: str, title: str, content: dict) -> Resume:
    resume = self.get_resume(resume_id, user_id)
    resume.title = title
    resume.content = content
    self._save_version(resume.id, content, "manual-update")
    self.db.commit()
    self.db.refresh(resume)
    return resume

  def duplicate_resume(self, resume_id: str, user_id: str) -> Resume:
    source = self.get_resume(resume_id, user_id)
    duplicate = Resume(
      user_id=user_id,
      title=f"{source.title} (Copy)",
      content=source.content
    )
    self.db.add(duplicate)
    self.db.flush()
    self._save_version(duplicate.id, duplicate.content, "duplicated")
    self.db.commit()
    self.db.refresh(duplicate)
    return duplicate

  def delete_resume(self, resume_id: str, user_id: str) -> None:
    resume = self.get_resume(resume_id, user_id)
    self.db.delete(resume)
    self.db.commit()

  def log_job_description(
    self,
    user_id: str,
    resume_id: str | None,
    text: str,
    extracted_keywords: list[str]
  ) -> JobDescription:
    jd = JobDescription(
      user_id=user_id,
      resume_id=resume_id,
      text=text,
      extracted_keywords=extracted_keywords
    )
    self.db.add(jd)
    self.db.commit()
    self.db.refresh(jd)
    return jd

  def log_export(
    self,
    user_id: str,
    resume_id: str | None,
    export_format: str,
    status_text: str = "completed"
  ) -> ExportRecord | None:
    if not resume_id:
      return None
    export = ExportRecord(
      user_id=user_id,
      resume_id=resume_id,
      format=export_format,
      status=status_text
    )
    self.db.add(export)
    self.db.commit()
    self.db.refresh(export)
    return export

  def _save_version(self, resume_id: str, content: dict, label: str) -> None:
    version = ResumeVersion(
      resume_id=resume_id,
      content=content,
      version_label=label,
      created_at=datetime.now(timezone.utc)
    )
    self.db.add(version)
