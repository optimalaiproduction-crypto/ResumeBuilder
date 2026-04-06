from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.resume import ResumeContentSchema


class ResumeDataPayload(BaseModel):
  title: str = Field(default="Resume", min_length=2, max_length=180)
  content: ResumeContentSchema


class ExportRequest(BaseModel):
  resumeId: str | None = None
  title: str = Field(default="Resume", min_length=2, max_length=180)
  content: ResumeContentSchema | None = None
  resumeData: ResumeDataPayload | None = None
  templateId: str | None = "ats_classic"
  method: str | None = "server"
  pdfEngine: Literal["auto", "weasyprint", "reportlab"] = "auto"

  @model_validator(mode="after")
  def validate_payload(self):
    if self.resumeData is None and self.content is None:
      raise ValueError("Either `resumeData` or `content` must be provided.")
    return self

  def resolved_title(self) -> str:
    if self.resumeData:
      return self.resumeData.title
    return self.title

  def resolved_content(self) -> dict:
    if self.resumeData:
      return self.resumeData.content.model_dump()
    if self.content is None:
      return {}
    return self.content.model_dump()


class ExportMetaResponse(BaseModel):
  status: Literal["ok"]
  format: Literal["docx", "pdf"]
