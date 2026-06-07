# Deployment Guide — Step by Step

## Step 1 — Accounts Setup (do this first)

### Ocean.io (student email workaround)
1. Go to [ocean.io](https://ocean.io) and click Sign Up
2. Use your **student/college email** directly (e.g. `yourname@college.edu`)
3. They've confirmed student emails are accepted as a workaround
4. Get your API key from the Ocean.io dashboard after signup

### Prospeo
1. Go to [app.prospeo.io/api](https://app.prospeo.io/api)
2. Sign up with any email
3. Free plan gives you API credits — grab your API key from the dashboard

### Brevo
1. Go to [app.brevo.com](https://app.brevo.com) and create a free account
2. Go to Settings → API Keys → Generate a new key
3. Go to Senders & Domains → Add and verify your sender email address
   - This is the email that outreach will be sent FROM
   - You can use your student email here too — just verify it

---

## Step 2 — Push to GitHub

```bash
cd outreach-pipeline
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/outreach-pipeline.git
git push -u origin main
```

---

## Step 3 — Deploy backend to Render (free)

1. Go to [render.com](https://render.com) → Sign up / Log in
2. Click **New** → **Web Service**
3. Connect your GitHub account and select your repo
4. Configure:
   - **Name**: `outreach-pipeline-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free
5. Click **Deploy**
6. Wait ~2 min for the build. Copy your URL: `https://outreach-pipeline-api.onrender.com`

> Note: Free Render instances spin down after 15min idle. The first request after idle takes ~30s to wake up. That's expected.

---

## Step 4 — Deploy frontend to Vercel (free)

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in with GitHub
2. Click **Add New → Project**
3. Import your `outreach-pipeline` repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Add **Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://outreach-pipeline-api.onrender.com` (your Render URL from Step 3)
6. Click **Deploy**
7. Your app is live at `https://your-project.vercel.app` 🎉

---

## Step 5 — Test it

1. Open your Vercel URL
2. Fill in:
   - Seed domain: `stripe.com` (or any company)
   - Ocean.io API key
   - Prospeo API key
   - Brevo API key
   - Sender email (the one you verified in Brevo)
   - Sender name
   - Check **Dry run** for first test (won't actually send emails)
3. Click **Run Pipeline**
4. Watch it stream live through all 4 stages

---

## Local Development

Terminal 1 (backend):
```bash
cd server
node index.js
# runs on http://localhost:3001
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
# runs on http://localhost:5173
# proxies /api calls to localhost:3001 automatically
```

No `.env` needed for local dev — the frontend sends API keys directly in the request body.
