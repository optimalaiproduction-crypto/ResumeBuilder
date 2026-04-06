import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResumeContent(BaseModel):
  full_name: str = ""
  email: str = ""
  phone: str = ""
  summary: str = ""
  skills: list[str] = Field(default_factory=list)
  experience: list[str] = Field(default_factory=list)
  education: list[str] = Field(default_factory=list)


class ResumeCreate(BaseModel):
  title: str = Field(min_length=2, max_length=180)
  content: ResumeContent


class ResumeUpdate(BaseModel):
  title: str | None = Field(default=None, min_length=2, max_length=180)
  content: ResumeContent | None = None


class ResumeRead(BaseModel):
  id: uuid.UUID
  owner_id: str
  title: str
  content: ResumeContent
  created_at: datetime
  updated_at: datetime | None = None

  model_config = ConfigDict(from_attributes=True)


class ResumeListItem(BaseModel):
  id: uuid.UUID
  title: str
  content: ResumeContent
  created_at: datetime
  updated_at: datetime | None = None

  model_config = ConfigDict(from_attributes=True)
