import logging
import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


def brevo_configured(settings: Settings) -> bool:
  return bool((settings.brevo_api_key or "").strip() and (settings.brevo_sender_email or "").strip())


def smtp_only_configured(settings: Settings) -> bool:
  return bool((settings.smtp_host or "").strip() and (settings.smtp_from_email or "").strip())


def smtp_configured(settings: Settings) -> bool:
  # Backward-compatible function name used by auth route.
  return brevo_configured(settings) or smtp_only_configured(settings)


def send_password_reset_email(
  *,
  settings: Settings,
  to_email: str,
  reset_url: str,
  expire_minutes: int,
) -> bool:
  if not smtp_configured(settings):
    return False

  subject = "Reset your ResumeForge password"

  text_body = (
    "You requested a password reset for your ResumeForge account.\n\n"
    f"Use this link to reset your password (expires in {expire_minutes} minutes):\n"
    f"{reset_url}\n\n"
    "If you did not request this change, you can safely ignore this email."
  )
  html_body = (
    "<p>You requested a password reset for your ResumeForge account.</p>"
    f"<p><a href=\"{reset_url}\">Reset your password</a> "
    f"(expires in {expire_minutes} minutes).</p>"
    "<p>If you did not request this change, you can safely ignore this email.</p>"
  )

  recipient = to_email.strip()
  if not recipient:
    return False

  if brevo_configured(settings):
    if send_password_reset_email_via_brevo(
      settings=settings,
      to_email=recipient,
      subject=subject,
      text_body=text_body,
      html_body=html_body
    ):
      return True
    logger.warning("Brevo delivery failed; attempting SMTP fallback if configured.")

  if not smtp_only_configured(settings):
    return False

  sender = (settings.smtp_from_email or "").strip()
  if not sender:
    return False

  msg = EmailMessage()
  msg["Subject"] = subject
  from_name = (settings.smtp_from_name or "ResumeForge").strip()
  msg["From"] = f"{from_name} <{sender}>"
  msg["To"] = recipient
  reply_to = (settings.smtp_reply_to or sender).strip()
  if reply_to:
    msg["Reply-To"] = reply_to
  msg.set_content(text_body)
  msg.add_alternative(html_body, subtype="html")

  timeout = max(5, int(settings.smtp_timeout_seconds))
  host = (settings.smtp_host or "").strip()
  port = int(settings.smtp_port)
  username = (settings.smtp_username or "").strip()
  password = settings.smtp_password or ""

  try:
    if settings.smtp_use_ssl:
      with smtplib.SMTP_SSL(host=host, port=port, timeout=timeout) as client:
        if username:
          client.login(username, password)
        client.send_message(msg)
      return True

    with smtplib.SMTP(host=host, port=port, timeout=timeout) as client:
      client.ehlo()
      if settings.smtp_use_tls:
        client.starttls(context=ssl.create_default_context())
        client.ehlo()
      if username:
        client.login(username, password)
      client.send_message(msg)
    return True
  except Exception:
    logger.exception("Failed to send password reset email to %s", recipient)
    return False


def send_password_reset_email_via_brevo(
  *,
  settings: Settings,
  to_email: str,
  subject: str,
  text_body: str,
  html_body: str
) -> bool:
  api_key = (settings.brevo_api_key or "").strip()
  sender_email = (settings.brevo_sender_email or "").strip()
  if not api_key or not sender_email:
    return False

  sender_name = (settings.brevo_sender_name or "ResumeForge").strip()
  reply_to_email = (settings.brevo_reply_to or sender_email).strip()
  base_url = (settings.brevo_base_url or "https://api.brevo.com").strip().rstrip("/")
  timeout = max(5, int(settings.smtp_timeout_seconds))

  payload: dict = {
    "sender": {"name": sender_name, "email": sender_email},
    "to": [{"email": to_email}],
    "subject": subject,
    "textContent": text_body,
    "htmlContent": html_body,
  }
  if reply_to_email:
    payload["replyTo"] = {"email": reply_to_email}

  try:
    response = httpx.post(
      f"{base_url}/v3/smtp/email",
      headers={
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key,
      },
      json=payload,
      timeout=timeout
    )
    response.raise_for_status()
    return True
  except Exception:
    logger.exception("Failed to send password reset email via Brevo to %s", to_email)
    return False
