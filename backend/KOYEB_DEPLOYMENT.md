# Koyeb Free Tier Deployment Guide — FabLab GMAO Backend & AI Agent

This guide provides step-by-step instructions for deploying the Node.js backend to **Koyeb Free Tier** from GitHub and connecting it to your static **GitHub Pages** frontend (`https://mohammed-aichour.github.io/FAB-LAB/`).

---

## 🚀 Steps to Deploy from GitHub to Koyeb

### STEP 1 — Push your changes to GitHub
```bash
git add .
git commit -m "Configure backend for Koyeb Free Tier deployment"
git push origin main
```

### STEP 2 — Log in to Koyeb
Go to [https://app.koyeb.com/](https://app.koyeb.com/) and sign in with your GitHub account.

### STEP 3 — Create a New Service
1. Click **Create Service** or **Create App**.
2. Select **GitHub** as the deployment method.
3. Choose your repository: **`Mohammed-aichour/FAB-LAB`** (or `FAB-LAB`).

### STEP 4 — Configure Service Settings
- **Workdir / Root Directory:** `Anti/backend`
- **Builder:** Select **Buildpack** (Node.js) OR **Dockerfile** (`Anti/backend/Dockerfile`).
- **Instance Type:** **Free** (Nano / 512MB RAM).
- **Port:** Set exposed port to `8000` (or `5000`).

### STEP 5 — Environment Variables to Add in Koyeb
Under **Environment Variables**, add the following key-value pairs:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port assigned to the Koyeb instance |
| `FRONTEND_URL` | `https://mohammed-aichour.github.io` | Allowed CORS frontend origin |
| `FRONTEND_ORIGIN` | `https://mohammed-aichour.github.io` | Legacy/alternative CORS origin |
| `JWT_SECRET` | `YOUR_JWT_SECRET_KEY_MIN_32_CHARS` | Secret for signing session tokens |
| `OPENAI_API_KEY` | `sk-proj-...` | Your active OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI GPT model |
| `OPENAI_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | OpenAI transcription model |
| `GMAO_DATA_DIR` | `../../data_db` | Path for JSON database files |

### STEP 6 — Deploy Service & Copy Koyeb Public URL
1. Click **Deploy**.
2. Once the service build finishes and state changes to **Healthy**, copy your Koyeb service public URL.
   *Example:* `https://fablab-gmao-backend.koyeb.app`

### STEP 7 — Test Health Check
Open in browser or terminal:
`https://fablab-gmao-backend.koyeb.app/api/health`

Expected JSON response:
```json
{
  "status": "ok",
  "message": "GMAO API is running"
}
```

### STEP 8 — Connect Frontend to Koyeb Backend
1. In `Anti/frontend/.env.production` (or `.env.local`), update `VITE_API_URL`:
   ```env
   VITE_API_URL=https://fablab-gmao-backend.koyeb.app
   ```
2. Rebuild the frontend bundle for GitHub Pages:
   ```bash
   npm --prefix Anti/frontend run build
   ```
3. Commit and push the generated `docs` directory:
   ```bash
   git add .
   git commit -m "Connect frontend to live Koyeb backend"
   git push origin main
   ```

### STEP 9 — Open GitHub Pages & Test
Navigate to **[https://mohammed-aichour.github.io/FAB-LAB/](https://mohammed-aichour.github.io/FAB-LAB/)** and verify that login, database endpoints, and AI Assistant communicate cleanly with your Koyeb backend!
