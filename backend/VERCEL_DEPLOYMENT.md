# Vercel Deployment Guide — FabLab GMAO Backend & AI Agent

This guide provides step-by-step instructions for deploying the Node.js backend to **Vercel** as a Serverless Function and connecting it to your static **GitHub Pages** frontend (`https://mohammed-aichour.github.io/FAB-LAB/`) or running full-stack on Vercel.

---

## 🚀 Steps to Deploy from GitHub to Vercel

### STEP 1 — Push your changes to GitHub
```bash
git add .
git commit -m "Configure backend for Vercel Serverless deployment"
git push origin main
```

### STEP 2 — Log in to Vercel
Go to [https://vercel.com/](https://vercel.com/) and sign in with your GitHub account.

### STEP 3 — Import GitHub Repository
1. Click **Add New...** → **Project**.
2. Select your repository: **`Mohammed-aichour/FAB-LAB`**.

### STEP 4 — Configure Project Settings
- **Framework Preset:** `Other` (or `Vite` if deploying frontend + backend together).
- **Root Directory:** `Anti/backend` (if deploying backend separately) or `Anti` (if deploying full-stack).
- **Build Command:** `npm install` (or leave default).
- **Output Directory:** `public` (or leave default).

### STEP 5 — Environment Variables to Add in Vercel
Under **Environment Variables** in the Vercel dashboard, add:

| Variable Name | Value / Placeholder | Description |
| :--- | :--- | :--- |
| `FRONTEND_URL` | `https://mohammed-aichour.github.io` | Allowed CORS origin |
| `FRONTEND_ORIGIN` | `https://mohammed-aichour.github.io` | Allowed CORS origin |
| `JWT_SECRET` | `YOUR_JWT_SECRET_KEY_MIN_32_CHARS` | Secret key for JWT tokens |
| `OPENAI_API_KEY` | `sk-proj-...` | Your active OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI GPT model |
| `OPENAI_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | OpenAI transcription model |
| `GMAO_DATA_DIR` | `/tmp/data_db` | Storage path for serverless environment |

### STEP 6 — Deploy Service & Obtain Vercel URL
1. Click **Deploy**.
2. Once the deployment finishes, copy your live Vercel URL.
   *Example:* `https://fablab-gmao-backend.vercel.app`

### STEP 7 — Test Health Endpoint
Open in browser or terminal:
`https://fablab-gmao-backend.vercel.app/api/health`

Expected JSON response:
```json
{
  "status": "ok",
  "message": "GMAO API is running"
}
```

### STEP 8 — Connect GitHub Pages Frontend to Vercel Backend
1. Update `Anti/frontend/.env.production`:
   ```env
   VITE_API_URL=https://fablab-gmao-backend.vercel.app
   ```
2. Rebuild the frontend static bundle for GitHub Pages:
   ```bash
   npm --prefix Anti/frontend run build
   ```
3. Commit and push the generated `docs` directory:
   ```bash
   git add .
   git commit -m "Connect GitHub Pages frontend to Vercel API"
   git push origin main
   ```

---

## ⚠️ Vercel Serverless Function Storage Note
Vercel Serverless Functions execute in stateless, ephemeral environments. Writes to `/tmp` are temporary. For persistent database storage across serverless function warmups, set `GMAO_DATA_DIR=/tmp/data_db` or connect an external database. The frontend includes a built-in static client-side fallback system for continuous availability.
