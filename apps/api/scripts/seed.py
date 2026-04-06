from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from app.services.resume_service import ResumeService


def run():
  db = SessionLocal()
  try:
    user = db.scalar(select(User).where(User.email == "demo@resumeforge.dev"))
    if user is None:
      user = User(email="demo@resumeforge.dev", password_hash=hash_password("password123"))
      db.add(user)
      db.commit()
      db.refresh(user)

    resume_service = ResumeService(db)
    existing = resume_service.list_resumes(user.id)
    if not existing:
      resume_service.create_resume(
        user_id=user.id,
        title="Demo Resume",
        content={
          "basics": {
            "fullName": "Demo User",
            "email": "demo@resumeforge.dev",
            "phone": "+91 99999 99999",
            "location": "Bengaluru",
            "linkedin": "",
            "website": ""
          },
          "summary": "Backend engineer focused on building reliable products.",
          "workExperience": [
            {
              "id": "w1",
              "company": "Example Corp",
              "title": "Software Engineer",
              "startDate": "2022",
              "endDate": "",
              "current": True,
              "bullets": ["Built API endpoints used by 50k+ monthly users."]
            }
          ],
          "education": [],
          "skills": ["python", "fastapi", "postgresql", "docker"],
          "projects": [],
          "certifications": []
        }
      )
    print("Seed complete. Demo login: demo@resumeforge.dev / password123")
  finally:
    db.close()


if __name__ == "__main__":
  run()
