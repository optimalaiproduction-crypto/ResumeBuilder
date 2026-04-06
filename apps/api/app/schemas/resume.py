from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BasicsSchema(BaseModel):
  fullName: str = Field(min_length=1)
  email: EmailStr
  phone: str = ""
  location: str = ""
  linkedin: str = ""
  website: str = ""
  photoUrl: str = ""


class WorkExperienceSchema(BaseModel):
  id: str
  company: str = Field(min_length=1)
  title: str = Field(min_length=1)
  startDate: str = ""
  endDate: str = ""
  current: bool = False
  bullets: list[str] = Field(default_factory=list)


class EducationSchema(BaseModel):
  id: str
  institution: str = Field(min_length=1)
  degree: str = Field(min_length=1)
  startDate: str = ""
  endDate: str = ""


class ProjectSchema(BaseModel):
  id: str
  name: str = Field(min_length=1)
  description: str = ""
  link: str = ""
  technologies: list[str] = Field(default_factory=list)
  bullets: list[str] = Field(default_factory=list)


class CertificationSchema(BaseModel):
  id: str
  name: str = Field(min_length=1)
  issuer: str = ""
  date: str = ""
  link: str = ""


class ResumeContentSchema(BaseModel):
  basics: BasicsSchema
  summary: str = ""
  workExperience: list[WorkExperienceSchema] = Field(default_factory=list)
  education: list[EducationSchema] = Field(default_factory=list)
  skills: list[str] = Field(default_factory=list)
  projects: list[ProjectSchema] = Field(default_factory=list)
  certifications: list[CertificationSchema] = Field(default_factory=list)


class ResumeCreateRequest(BaseModel):
  title: str = Field(min_length=2, max_length=180)
  content: ResumeContentSchema


class ResumeUpdateRequest(BaseModel):
  title: str = Field(min_length=2, max_length=180)
  content: ResumeContentSchema


class ResumeResponse(BaseModel):
  id: str
  title: str
  user_id: str
  content: ResumeContentSchema
  created_at: datetime
  updated_at: datetime

  model_config = ConfigDict(from_attributes=True)


class ResumeListResponse(BaseModel):
  items: list[ResumeResponse]
