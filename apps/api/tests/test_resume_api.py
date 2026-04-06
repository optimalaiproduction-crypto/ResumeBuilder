from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.api.routes.auth import FORGOT_PASSWORD_MESSAGE, hash_reset_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import LoginEvent, PasswordResetToken, User


def register_and_login(client):
  register = client.post(
    "/api/v1/auth/register",
    json={"full_name": "Test User", "email": "test@example.com", "password": "password123"}
  )
  if register.status_code == 200:
    register_payload = register.json()
    assert register_payload["user"]["full_name"] == "Test User"
    assert register_payload["user"]["email"] == "test@example.com"
    assert register_payload["user"]["id"]
    assert register_payload["user"]["created_at"] is not None
    token = register.json()["access_token"]
  else:
    assert register.status_code == 409
    login = client.post(
      "/api/v1/auth/login",
      json={"email": "test@example.com", "password": "password123"}
    )
    assert login.status_code == 200
    login_payload = login.json()
    assert "user" in login_payload
    assert login_payload["user"]["email"] == "test@example.com"
    assert login_payload["user"]["id"]
    token = login.json()["access_token"]
  return {"Authorization": f"Bearer {token}"}


def sample_resume_payload():
  return {
    "title": "Backend Engineer Resume",
    "content": {
      "basics": {
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "111-222-3333",
        "location": "Delhi",
        "linkedin": "",
        "website": ""
      },
      "summary": "Backend engineer shipping APIs.",
      "workExperience": [
        {
          "id": "work1",
          "company": "Acme",
          "title": "Engineer",
          "startDate": "2021",
          "endDate": "2024",
          "current": False,
          "bullets": ["Built APIs with Python and PostgreSQL."]
        }
      ],
      "education": [],
      "skills": ["python", "fastapi", "postgresql"],
      "projects": [],
      "certifications": []
    }
  }


def test_resume_crud_flow(client):
  headers = register_and_login(client)

  create = client.post("/api/v1/resumes", headers=headers, json=sample_resume_payload())
  assert create.status_code == 201
  resume_id = create.json()["id"]

  list_response = client.get("/api/v1/resumes", headers=headers)
  assert list_response.status_code == 200
  assert len(list_response.json()["items"]) == 1

  get_response = client.get(f"/api/v1/resumes/{resume_id}", headers=headers)
  assert get_response.status_code == 200
  assert get_response.json()["title"] == "Backend Engineer Resume"

  updated_payload = sample_resume_payload()
  updated_payload["title"] = "Updated Resume"
  update_response = client.put(f"/api/v1/resumes/{resume_id}", headers=headers, json=updated_payload)
  assert update_response.status_code == 200
  assert update_response.json()["title"] == "Updated Resume"

  duplicate_response = client.post(f"/api/v1/resumes/{resume_id}/duplicate", headers=headers)
  assert duplicate_response.status_code == 201

  delete_response = client.delete(f"/api/v1/resumes/{resume_id}", headers=headers)
  assert delete_response.status_code == 204


def test_ai_extract_keywords(client):
  headers = register_and_login(client)
  response = client.post(
    "/api/v1/ai/extract-keywords",
    headers=headers,
    json={
      "jobDescription": "We need a Python FastAPI backend engineer with PostgreSQL, Docker, and REST API design experience."
    }
  )
  assert response.status_code == 200
  assert len(response.json()["keywords"]) > 0


def test_ai_provider_status_endpoint(client):
  headers = register_and_login(client)
  response = client.get("/api/v1/ai/providers/status", headers=headers)
  assert response.status_code == 200
  payload = response.json()
  assert "mode" in payload
  assert "chain" in payload
  assert "providers" in payload


def test_login_creates_login_event(client):
  register = client.post(
    "/api/v1/auth/register",
    json={"full_name": "Event Test", "email": "event-test@example.com", "password": "password123"}
  )
  assert register.status_code == 200

  with SessionLocal() as db:
    before_count = db.scalar(select(func.count()).select_from(LoginEvent)) or 0

  login = client.post(
    "/api/v1/auth/login",
    json={"email": "event-test@example.com", "password": "password123"},
    headers={"User-Agent": "pytest-agent"}
  )
  assert login.status_code == 200
  assert login.json()["user"]["full_name"] == "Event Test"

  with SessionLocal() as db:
    after_count = db.scalar(select(func.count()).select_from(LoginEvent)) or 0
    latest = db.execute(
      select(LoginEvent).where(LoginEvent.email == "event-test@example.com").order_by(LoginEvent.created_at.desc())
    ).scalars().first()

  assert after_count == before_count + 1
  assert latest is not None
  assert latest.user_agent.startswith("pytest-agent")


def test_forgot_password_is_generic_and_creates_token_for_existing_user(client, monkeypatch):
  monkeypatch.setattr("app.api.routes.auth.smtp_configured", lambda _settings: True)
  monkeypatch.setattr("app.api.routes.auth.send_password_reset_email", lambda **_kwargs: True)

  register = client.post(
    "/api/v1/auth/register",
    json={"full_name": "Forgot Test", "email": "forgot-test@example.com", "password": "password123"}
  )
  assert register.status_code == 200

  existing = client.post("/api/v1/auth/forgot-password", json={"email": "forgot-test@example.com"})
  missing = client.post("/api/v1/auth/forgot-password", json={"email": "does-not-exist@example.com"})

  assert existing.status_code == 200
  assert missing.status_code == 200
  assert existing.json()["message"] == FORGOT_PASSWORD_MESSAGE
  assert missing.json()["message"] == FORGOT_PASSWORD_MESSAGE

  with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == "forgot-test@example.com"))
    token_count = db.scalar(
      select(func.count()).select_from(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )

  assert user is not None
  assert token_count and token_count >= 1


def test_reset_password_updates_hash_and_invalidates_token(client):
  register = client.post(
    "/api/v1/auth/register",
    json={"full_name": "Reset Test", "email": "reset-test@example.com", "password": "password123"}
  )
  assert register.status_code == 200

  raw_token = "test-reset-token-abcdefghijklmnopqrstuvwxyz"
  settings = get_settings()
  with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == "reset-test@example.com"))
    assert user is not None
    db.add(
      PasswordResetToken(
        user_id=user.id,
        token_hash=hash_reset_token(raw_token, settings),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
      )
    )
    db.commit()

  reset = client.post(
    "/api/v1/auth/reset-password",
    json={
      "token": raw_token,
      "new_password": "newpassword123",
      "confirm_password": "newpassword123"
    }
  )
  assert reset.status_code == 200
  assert "successfully" in reset.json()["message"].lower()

  old_login = client.post("/api/v1/auth/login", json={"email": "reset-test@example.com", "password": "password123"})
  assert old_login.status_code == 401

  new_login = client.post("/api/v1/auth/login", json={"email": "reset-test@example.com", "password": "newpassword123"})
  assert new_login.status_code == 200

  reused = client.post(
    "/api/v1/auth/reset-password",
    json={
      "token": raw_token,
      "new_password": "anotherpass123",
      "confirm_password": "anotherpass123"
    }
  )
  assert reused.status_code == 400
