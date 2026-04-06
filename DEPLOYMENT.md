# ResumeForge No-Card Deployment (Firebase Auth Mode)

This guide deploys from scratch and uses Firebase Authentication for login and password reset.

- Frontend: Vercel Hobby (free)
- Backend: Render Free Web Service
- Database: Hostinger MySQL
- Password reset: Firebase Auth email flow (no app SMTP required)

## 0) Start fresh in cloud dashboards

1. Delete old Vercel ResumeForge projects.
2. Delete old Render ResumeForge services.
3. Remove old env vars before creating new services.

## 1) Push latest code

```bash
git add .
git commit -m "Switch to Firebase auth mode"
git push origin main
```

## 2) Prepare Firebase Auth

1. Firebase Console -> Authentication -> Sign-in method:
   - enable `Email/Password`
2. Firebase Console -> Authentication -> Settings -> Authorized domains:
   - add your Vercel domain (`<project>.vercel.app`)
3. Firebase Console -> Authentication -> Templates -> Password reset:
   - set custom action URL to `https://<project>.vercel.app/reset-password`

## 3) Deploy backend on Render

1. Render -> New -> Web Service -> connect GitHub repo.
2. Repo: `optimalaiproduction-crypto/ResumeBuilder`, branch `main`
3. Runtime: `Docker`
4. Root Directory: `apps/api`
5. Dockerfile: `./Dockerfile`
6. Health check path: `/api/v1/health`
7. Add env vars:

```env
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=mysql+pymysql://<db_user>:<db_password>@<db_host>:3306/<db_name>?charset=utf8mb4
JWT_SECRET_KEY=<strong-random-secret>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FRONTEND_URL=https://<project>.vercel.app
```

8. Deploy backend.
9. Validate:
   - `https://<render-service>.onrender.com/api/v1/health`

## 4) Hostinger database access

1. In hPanel, enable remote access for the MySQL user in `DATABASE_URL`.
2. If an allow-list is enabled, add Render outbound access.
3. Re-check backend health URL.

## 5) Deploy frontend on Vercel

1. Import same GitHub repo in Vercel.
2. Root Directory: `apps/web`
3. Add env vars:

```env
NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_APP_ID=<firebase-web-config>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<firebase-web-config>
```

4. Deploy and copy final Vercel URL.

## 6) Final CORS update

Update backend `FRONTEND_URL` with all web origins:

```text
https://<project>.vercel.app,https://<custom-domain>
```

Redeploy backend.

## 7) Test full flow

1. Register new account
2. Login
3. Create/edit/save resume
4. Use forgot password
5. Open reset link from email
6. Set new password and login again

## 8) Notes

1. Never commit secrets to git.
2. Rotate any credentials shared in chat.
3. IMAP/SMTP are not required in Firebase-auth mode.
