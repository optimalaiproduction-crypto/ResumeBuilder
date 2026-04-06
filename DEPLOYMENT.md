# ResumeForge No-Card Deployment (Fresh Start)

This guide is for a fresh deployment with no paid plan and no SMTP dependency on the hosting provider.

- Frontend: Vercel Hobby (free)
- Backend: Render Free Web Service
- Database: Hostinger MySQL (existing)
- Password reset email: Brevo Transactional API (free, no card required by Brevo free plan)

## 0) Fresh reset in dashboards

Delete old deployments before creating new ones:

1. Vercel: delete previous ResumeForge projects.
2. Render: delete previous ResumeForge services.
3. Remove old env vars from both providers.

## 1) Push code to GitHub

```bash
git add .
git commit -m "No-card deployment setup"
git push origin main
```

## 2) Create Brevo free account for reset emails

1. Sign up at Brevo.
2. Verify sender email/domain (use your domain email, e.g. `notify@nextlinecreative.in`).
3. Create API key (SMTP/API section).
4. Keep this safe:
   - `BREVO_API_KEY`

## 3) Deploy backend on Render

1. Create new Render **Web Service** from GitHub.
2. Repo: `optimalaiproduction-crypto/ResumeBuilder`, branch `main`.
3. Runtime:
   - `Docker`
4. Root directory:
   - `apps/api`
5. Dockerfile:
   - `./Dockerfile`
6. Health check:
   - `/api/v1/health`
7. Add env vars:

```env
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=mysql+pymysql://<db_user>:<db_password>@<db_host>:3306/<db_name>?charset=utf8mb4
JWT_SECRET_KEY=<strong-random-secret>
FRONTEND_URL=https://<your-vercel-domain>

# Brevo API email (preferred for free hosting)
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_EMAIL=notify@nextlinecreative.in
BREVO_SENDER_NAME=Nextline Creative
BREVO_REPLY_TO=notify@nextlinecreative.in
BREVO_BASE_URL=https://api.brevo.com

# Optional SMTP fallback
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
9. Validate:
   - `https://<your-render-service>.onrender.com/api/v1/health`

## 4) Hostinger DB remote access

In hPanel:

1. Enable remote DB access for the DB user in `DATABASE_URL`.
2. If allow-list is enabled, add Render outbound access as needed.
3. Re-test backend health URL.

## 5) Deploy frontend on Vercel

1. Import same GitHub repo.
2. Root Directory:
   - `apps/web`
3. Env vars:

```env
NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=<from-firebase>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from-firebase>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<from-firebase>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_APP_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<from-firebase>
```

4. Deploy and copy the Vercel URL.

## 6) Final CORS sync

Update backend `FRONTEND_URL`:

```text
https://<your-vercel-domain>,https://<your-custom-domain>
```

Redeploy backend.

## 7) Test full flow

1. Register/Login
2. Forgot password
3. Confirm reset email received
4. Reset password
5. Login with new password

## 8) Important notes

1. Keep all secrets in dashboard env vars only.
2. Rotate credentials immediately if they were shared.
3. IMAP settings are not required by this app; only outbound email delivery is used.
4. If a provider asks for billing verification on your account, stop and switch to another free provider/account path.
