# Render Backend Deployment Guide — FabLab GMAO & AI Agent

This guide details step-by-step instructions to deploy the Node.js backend to **Render** as an HTTPS Web Service and connect it to your static **GitHub Pages** frontend (`https://mohammed-aichour.github.io/FAB-LAB/`).

---

## Deployment Steps

### STEP 1 — Push project to GitHub
Ensure all recent changes in the repository are committed and pushed:
```bash
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### STEP 2 — Open Render Dashboard
Go to [https://dashboard.render.com/](https://dashboard.render.com/) and sign in with your account.

### STEP 3 — Create a New Web Service
Click on **New +** and select **Web Service**.

### STEP 4 — Connect the GitHub Repository
Select your repository: **`FAB-LAB`** (or `Mohammed-aichour/FAB-LAB`).

### STEP 5 — Configure Service Settings
Fill in the deployment configuration:
- **Name:** `fablab-gmao-backend` (or your preferred name)
- **Region:** Frankfurt (EU) or closest region
- **Branch:** `main`
- **Root Directory:** `Anti/backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

---

### STEP 6 — Environment Variables
Under the **Environment Variables** section, add the following required keys:

| Key | Example / Description |
| :--- | :--- |
| `NODE_VERSION` | `20` |
| `FRONTEND_ORIGIN` | `https://mohammed-aichour.github.io` |
| `JWT_SECRET` | `supersecret_jwt_key_for_dev_only_32chars_min` |
| `OPENAI_API_KEY` | `sk-proj-YOUR_ACTUAL_OPENAI_API_KEY` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENAI_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` |
| `GMAO_DATA_DIR` | `../../data_db` |

---

### STEP 7 — Deploy the Web Service
Click **Create Web Service**. Render will execute `npm install` and start the server using `npm start`.

### STEP 8 — Copy Your Render Live URL
Once deployment succeeds (Status: **Live**), copy your public HTTPS service URL.
Example:
`https://fablab-gmao-backend.onrender.com`

---

### STEP 9 — Verify Backend Health
Test the health endpoint in your browser or terminal:
`https://fablab-gmao-backend.onrender.com/api/health`

Expected JSON response:
```json
{
  "status": "ok",
  "message": "GMAO API is running"
}
```

---

### STEP 10 — Configure Frontend for Production
Update `Anti/frontend/.env.production` (or `.env.local`) with your live Render URL:
```env
VITE_API_URL=https://fablab-gmao-backend.onrender.com
```

---

### STEP 11 — Rebuild Frontend Static Bundle
Compile the production frontend build into `Anti/docs`:
```bash
npm --prefix Anti/frontend run build
```

---

### STEP 12 — Commit & Push to GitHub
Commit the production build files:
```bash
git add .
git commit -m "Connect AI Assistant to Render backend"
git push origin main
```

---

### STEP 13 — Wait for GitHub Pages Deployment
GitHub Pages automatically deploys the updated `Anti/docs` directory (typically 1 to 2 minutes).

---

### STEP 14 — Open the GitHub Pages Site
Navigate to:
👉 **[https://mohammed-aichour.github.io/FAB-LAB/](https://mohammed-aichour.github.io/FAB-LAB/)**

---

### STEP 15 — Test Login & AI Assistant
1. Log in using any demo account (e.g. `superviseur@fablab.com` / `password123`).
2. Open the Floating AI Assistant orb at the bottom-right corner.
3. Click any prompt suggestion (e.g. *"Planning maintenance"* or *"Quelles machines sont en panne ?"*) or send a custom question.
4. Verify in the Browser Developer Console (Network tab) that requests to `https://fablab-gmao-backend.onrender.com/api/assistant/chat` return HTTP 200 without any CORS or authentication errors!

---

## ⚠️ Important Note on JSON Database Persistence on Render

- **Render Ephemeral Storage:** Standard Render Web Services have ephemeral local file storage. Any new data written to disk (e.g. newly created machines, stock updates, or new work orders) will be reset when Render restarts or redeploys the container, **unless a persistent disk is attached**.
- **Persistent Disk Option:** If you require data to persist permanently across Render redeployments without using an external SQL database, navigate to **Disks** in your Render service settings and attach a persistent disk mounted to `/var/data`, then set `GMAO_DATA_DIR=/var/data`.
- **Static Fallback Protection:** The frontend includes an automatic client-side fallback system that preserves user experience even if the backend is temporarily sleeping on Render's free tier.
