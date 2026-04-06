# ResumeForge Fresh Deployment (Free + Working Password Reset Email)

This guide is for a clean restart deployment from zero.

- Frontend (free): Vercel Hobby
- Backend (free): Koyeb Free Instance
- Database: your existing Hostinger MySQL
- Password reset email: Hostinger SMTP (`smtp.hostinger.com:465`, SSL)

## 0) Start Fresh (remove previous deployment roots)

Do this first so old root-directory settings do not interfere:

1. Vercel dashboard:
   - Delete old ResumeForge projects (especially any that used root `frontend`, `backend`, or repo root by mistake).
2. Koyeb/Render:
   - Delete old ResumeForge services/apps so only one API deployment exists.
3. In every provider, remove old environment variables for this app.

## 1) Connect this folder to GitHub

If this folder has no `.git`:

```bash
git init
git branch -M main
git remote add origin <your-github-repo-url>
git add .
git commit -m "Fresh deployment setup"
git push -u origin main
```

If your repo is already connected:

```bash
git add .
git commit -m "Fresh deployment update"
git push origin main
```

## 2) Prepare production values

You will need these before deploying:

1. Backend URL placeholder (you will get it from Koyeb later), for example:
   - `https://<your-koyeb-service>.koyeb.app/api/v1`
2. Frontend URL placeholder (you will get it from Vercel later), for example:
   - `https://<your-project>.vercel.app`
3. A strong JWT secret (generate once):

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

4. Firebase web app keys (all `NEXT_PUBLIC_FIREBASE_*` values).

## 3) Deploy backend on Koyeb (free)

1. Sign in to Koyeb and create a new **Web Service** from GitHub.
2. Select this repository and branch `main`.
3. Set **Work directory** to:
   - `apps/api`
4. Builder/runtime:
   - Use Dockerfile from work directory (`./Dockerfile`).
5. Instance type:
   - `free` (one free service per organization).
6. Set health check path:
   - `/api/v1/health`
7. Add environment variables:

```env
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=mysql+pymysql://<db_user>:<db_password>@<db_host>:3306/<db_name>?charset=utf8mb4
JWT_SECRET_KEY=<paste-generated-secret>
FRONTEND_URL=https://<your-project>.vercel.app

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=notify@nextlinecreative.in
SMTP_PASSWORD=<your-email-password>
SMTP_FROM_EMAIL=notify@nextlinecreative.in
SMTP_FROM_NAME=Nextline Creative
SMTP_REPLY_TO=notify@nextlinecreative.in
SMTP_USE_TLS=false
SMTP_USE_SSL=true
SMTP_TIMEOUT_SECONDS=20
```

8. Deploy.
9. Confirm health is live:
   - `https://<your-koyeb-service>.koyeb.app/api/v1/health`

## 4) Hostinger DB remote access

In Hostinger hPanel:

1. Enable remote access for your MySQL user.
2. If IP allow-list is required, add current outbound IP ranges for your Koyeb region.
3. Save changes and test backend health again.

## 5) Deploy frontend on Vercel (free)

1. Import the same GitHub repository in Vercel.
2. Set **Root Directory**:
   - `apps/web`
3. Add environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://<your-koyeb-service>.koyeb.app/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=<from-firebase>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from-firebase>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<from-firebase>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_APP_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<from-firebase>
```

4. Deploy and copy your final Vercel URL.

## 6) Final CORS sync (required)

Update backend `FRONTEND_URL` to include all production origins, comma-separated:

```text
https://<your-project>.vercel.app,https://<your-custom-domain>
```

Redeploy backend after this change.

## 7) Verify password reset email works

1. Open frontend and register/login.
2. Use **Forgot Password** with a real account email.
3. Check inbox/spam for reset email from `notify@nextlinecreative.in`.
4. Open reset link, set new password, then login with new password.

If email is not received:

1. Check backend logs for SMTP errors.
2. Re-check SMTP settings:
   - host `smtp.hostinger.com`
   - port `465`
   - SSL `true`
   - TLS `false`
3. Verify mailbox password is correct in Koyeb env var.
4. If your environment rejects port `465`, switch to Hostinger TLS settings:
   - `SMTP_PORT=587`
   - `SMTP_USE_TLS=true`
   - `SMTP_USE_SSL=false`

## 8) Important notes

1. Never commit real secrets to git.
2. IMAP settings are not needed by this app (only SMTP is used for outgoing reset emails).
3. Free instances can sleep when idle, so first request after idle can be slower.
