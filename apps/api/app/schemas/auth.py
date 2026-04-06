from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
  full_name: str = Field(min_length=1, max_length=120)
  email: EmailStr
  password: str = Field(min_length=8, max_length=128)

  @field_validator("full_name")
  @classmethod
  def validate_full_name(cls, value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not normalized:
      raise ValueError("Full name is required.")
    return normalized


class LoginRequest(BaseModel):
  email: EmailStr
  password: str = Field(min_length=8, max_length=128)


class AuthUserProfile(BaseModel):
  id: str
  email: EmailStr
  full_name: str | None = None
  created_at: datetime | None = None


class AuthResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user_id: str
  email: EmailStr
  full_name: str | None = None
  user: AuthUserProfile


class ForgotPasswordRequest(BaseModel):
  email: EmailStr


class ForgotPasswordResponse(BaseModel):
  message: str
  dev_reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
  token: str = Field(min_length=20, max_length=512)
  new_password: str = Field(min_length=8, max_length=128)
  confirm_password: str = Field(min_length=8, max_length=128)

  @field_validator("token")
  @classmethod
  def validate_token(cls, value: str) -> str:
    token = value.strip()
    if not token:
      raise ValueError("Reset token is required.")
    return token

  @model_validator(mode="after")
  def passwords_match(self) -> "ResetPasswordRequest":
    if self.new_password != self.confirm_password:
      raise ValueError("Passwords do not match.")
    return self


class ResetPasswordResponse(BaseModel):
  message: str
