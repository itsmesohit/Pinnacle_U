# 🚀 Pinnacle University - Deployment & Production Guide

This guide covers deploying the backend to **Render** and the frontend to **Vercel** with Supabase PostgreSQL, Prisma ORM, and Resend OTP.

---

## 🏗️ Architecture Overview

| Component | Platform | Configuration |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | React 19 + Vite SPA, rewrites via `vercel.json` |
| **Backend API** | [Render](https://render.com) | Express + Prisma + Resend, config via `render.yaml` |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL with Prisma Schema |
| **Email OTP** | [Resend](https://resend.com) | Transactional OTP for Account Registration & Password Reset |

---

## 1. 🗄️ Supabase PostgreSQL Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/vqtdxakysdkncyprtlqt).
2. Go to **Project Settings** ➔ **Database** ➔ **Connection String**.
3. Under the **URI** tab:
   - For Render/Production (supports IPv6): Use the **Direct connection** (Port 5432).
   - For Local Development (if your ISP lacks IPv6): Use the **Connection Pooler** (Port 6543/5432).
4. **Important**: Because your password has special characters (`&`, `^`, `%`), it must be URL-encoded:
   - Raw password: `Ram(*&^9876%`
   - Encoded password: `Ram(*%26%5E9876%25`

### Database Commands:
```bash
# Push schema tables to Supabase:
npm run prisma:migrate

# Seed demo data (students, teachers, courses, departments, attendance, grades):
npm run prisma:seed
```

---

## 2. 🖥️ Backend Deployment to Render

1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`itsmesohit/Pinnacle_U`).
4. Configure the Web Service settings:
   - **Name**: `pinnacle-u-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx tsx server/index.ts`
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `postgresql://postgres:[YOUR-ENCODED-PASSWORD]@db.vqtdxakysdkncyprtlqt.supabase.co:5432/postgres`
   - `DIRECT_URL`: `postgresql://postgres:[YOUR-ENCODED-PASSWORD]@db.vqtdxakysdkncyprtlqt.supabase.co:5432/postgres`
   - `RESEND_API_KEY`: `re_your_resend_api_key_from_env`
   - `RESEND_FROM_EMAIL`: `Pinnacle University <onboarding@resend.dev>`
   - `JWT_SECRET`: Any random 32+ character string
   - `CORS_ORIGIN`: `*` (or your Vercel domain once deployed)
6. Click **Deploy Web Service**.
7. Once deployed, note your Render URL (e.g., `https://pinnacle-u-api.onrender.com`).

---

## 3. 🌐 Frontend Deployment to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository (`itsmesohit/Pinnacle_U`).
4. Configure Build and Output:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend API URL with `/api` suffix
     - *Example:* `https://pinnacle-u-api.onrender.com/api`
6. Click **Deploy**.
   *(The included `vercel.json` ensures client-side routing on page refreshes works without 404s!)*

---

## 4. 📧 Resend OTP Testing Notes

- While testing with `onboarding@resend.dev` (the free testing domain), Resend restricts delivery exclusively to the email registered with your Resend account (`itsmesohit.in@gmail.com`).
- To send OTP emails to arbitrary public addresses, verify a custom domain under [resend.com/domains](https://resend.com/domains) and update `RESEND_FROM_EMAIL`.
- In local development or if offline, the system automatically prints generated OTPs to the server console and UI alert so you can continue testing without interruption.
