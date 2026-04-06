import pytest
from pydantic import ValidationError

from app.schemas.resume import ResumeCreateRequest


def test_resume_schema_accepts_valid_payload():
  payload = {
    "title": "Valid Resume",
    "content": {
      "basics": {
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phone": "",
        "location": "",
        "linkedin": "",
        "website": ""
      },
      "summary": "",
      "workExperience": [],
      "education": [],
      "skills": [],
      "projects": [],
      "certifications": []
    }
  }
  model = ResumeCreateRequest.model_validate(payload)
  assert model.title == "Valid Resume"


def test_resume_schema_rejects_bad_email():
  payload = {
    "title": "Invalid Resume",
    "content": {
      "basics": {
        "fullName": "Jane Doe",
        "email": "not-an-email",
        "phone": "",
        "location": "",
        "linkedin": "",
        "website": ""
      },
      "summary": "",
      "workExperience": [],
      "education": [],
      "skills": [],
      "projects": [],
      "certifications": []
    }
  }

  with pytest.raises(ValidationError):
    ResumeCreateRequest.model_validate(payload)
