import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@advantageai.com")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

def send_verification_email(user_email: str, token: str):
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
        print(f"SMTP not configured. Verification token for {user_email}: {token}")
        return

    verification_link = f"{APP_URL}/verify-email?token={token}"
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your AdVantage AI account"
    msg["From"] = FROM_EMAIL
    msg["To"] = user_email

    html = f"""
    <html>
      <body>
        <h2>Welcome to AdVantage AI!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">{verification_link}</a></p>
        <p>If you did not sign up for an account, you can safely ignore this email.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, user_email, msg.as_string())
    except Exception as e:
        print(f"Failed to send verification email: {e}")

def send_password_reset_email(user_email: str, token: str):
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
        print(f"SMTP not configured. Reset token for {user_email}: {token}")
        return

    reset_link = f"{APP_URL}/reset-password?token={token}"
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your AdVantage AI password"
    msg["From"] = FROM_EMAIL
    msg["To"] = user_email

    html = f"""
    <html>
      <body>
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your AdVantage AI account.</p>
        <p>Please click the link below to set a new password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, user_email, msg.as_string())
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
