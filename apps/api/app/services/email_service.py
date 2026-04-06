import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import Settings

logger = logging.getLogger(__name__)


def smtp_configured(settings: Settings) -> bool:
  return bool((settings.smtp_host or "").strip() and (settings.smtp_from_email or "").strip())


def send_password_reset_email(
  *,
  settings: Settings,
  to_email: str,
  reset_url: str,
  expire_minutes: int,
) -> bool:
  if not smtp_configured(settings):
    return False

  sender = (settings.smtp_from_email or "").strip()
  recipient = to_email.strip()
  if not sender or not recipient:
    return False

  subject = "Reset your ResumeForge password"
  msg = EmailMessage()
  msg["Subject"] = subject
  from_name = (settings.smtp_from_name or "ResumeForge").strip()
  msg["From"] = f"{from_name} <{sender}>"
  msg["To"] = recipient
  reply_to = (settings.smtp_reply_to or sender).strip()
  if reply_to:
    msg["Reply-To"] = reply_to

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
