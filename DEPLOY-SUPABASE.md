# Deploy Your App with Supabase (Step-by-Step)

## Part 1: Supabase Setup

### Step 1: Create or Open Your Supabase Project
1. Go to https://supabase.com/dashboard
2. Log in
3. Click **New Project** (or pick an existing one)
4. Fill in:
   - **Name**: e.g. `desinetwork`
   - **Database Password**: create a strong password and SAVE IT somewhere (you'll need it)
   - **Region**: pick the closest one
5. Click **Create new project** and wait for it to finish

---

### Step 2: Create Your Database Tables
1. In your project, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy everything from `backend/src/db/schema.sql` in this repo and paste it into the editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned"

---

### Step 3: Get Your Database Connection String
1. Click **Settings** (gear icon, left sidebar)
2. Click **Database**
3. Scroll to **Connection string**
4. Select the tab **URI**
5. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the database password you created in Step 1
7. Save this string — you'll use it as `DATABASE_URL` when deploying

---

## Part 2: Deploy Backend to Render

### Step 4: Push Your Code to GitHub
1. If you haven't already, create a repo on GitHub and push your code:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

---

### Step 5: Create a Render Web Service
1. Go to https://render.com
2. Sign up or log in (use "Sign up with GitHub")
3. Click **New** → **Web Service**
4. Connect your GitHub account if asked
5. Select your **yellowpage** (or desinetwork) repository
6. Fill in:
   - **Name**: `desinetwork-backend` (or any name)
   - **Region**: pick one
   - **Root Directory**: type `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
7. Click **Advanced** (or scroll down) and add **Environment Variables**:
   - `DATABASE_URL` = paste the Supabase connection string from Step 3
   - `JWT_SECRET` = any long random string (e.g. `my-super-secret-jwt-key-12345`)
   - `RESEND_API_KEY` = your Resend API key (from https://resend.com/api-keys)
   - `FRONTEND_URL` = your Vercel URL (add after you deploy frontend, e.g. `https://xxx.vercel.app`)
   - `NODE_ENV` = `production`
8. Click **Create Web Service**
9. Wait for the deploy to finish
10. Copy your backend URL (e.g. `https://desinetwork-backend.onrender.com`)
11. After you deploy the frontend (Step 7), come back to Render → your service → **Environment** → add `FRONTEND_URL` = your Vercel URL → **Save changes** (this triggers a redeploy)

---

## Part 3: Deploy Frontend to Vercel

### Step 6: Update Frontend to Call Your Backend
Your frontend (Vercel) and backend (Render) are on different domains. The frontend must use your backend's full URL.

**Make these 2 code changes:**

1. **`frontend/src/lib/api.js`** — change line 4 to:
   ```
   baseURL: (import.meta.env.VITE_BACKEND_URL || '') + '/api' || '/api',
   ```
   (Or: `baseURL: import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL + '/api' : '/api'`)

2. **`frontend/src/lib/socket.js`** — change line 3 from `VITE_API_URL` to `VITE_BACKEND_URL`:
   ```
   const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || '';
   ```
   (The socket needs the base URL without `/api`)

3. When deploying to Vercel (Step 7), add this env var:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://desinetwork-backend.onrender.com` (your Render URL from Step 5 — no trailing slash, no `/api`)

### Step 6b: Allow Your Frontend in Backend CORS
In Render, add this env var to your backend service:
- **Name**: `FRONTEND_URL`
- **Value**: your Vercel URL, e.g. `https://yellowpage-xxx.vercel.app` (add this after you deploy the frontend; then click **Save changes** to redeploy)

---

### Step 7: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up or log in (use GitHub)
3. Click **Add New** → **Project**
4. Import your **yellowpage** repository
5. Configure:
   - **Root Directory**: Click **Edit** and set to `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (usually auto-detected)
   - **Output Directory**: `dist` (usually auto-detected)
6. Add Environment Variable:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://desinetwork-backend.onrender.com` (your Render URL from Step 5)
7. Click **Deploy**
8. Wait for it to finish
9. Copy your frontend URL (e.g. `https://yellowpage-xxx.vercel.app`)

---

## Part 4: Connect Your GoDaddy Domain

### Step 8: Add Custom Domain in Vercel
1. In your Vercel project, go to **Settings** → **Domains**
2. Type your domain (e.g. `www.yourdomain.com`)
3. Click **Add**
4. Vercel will show you DNS records to add (usually a CNAME or A record)

---

### Step 9: Update DNS at GoDaddy
1. Go to https://dcc.godaddy.com
2. Click your domain → **DNS** or **Manage DNS**
3. Add a **CNAME** record:
   - **Name**: `www` (or `@` if Vercel says so — some setups use A for root)
   - **Value**: `cname.vercel-dns.com` (or what Vercel gives you)
   - **TTL**: 600
4. For the root domain (`yourdomain.com`), Vercel will tell you what to add (often an A record)
5. Save. DNS can take 5 minutes to 48 hours to propagate.

---

## Summary

| What              | URL / Where                    |
|-------------------|--------------------------------|
| Database          | Supabase (cloud)               |
| Backend           | Render (e.g. `xxx.onrender.com`) |
| Frontend          | Vercel (e.g. `xxx.vercel.app`) |
| Your custom domain | Points to Vercel              |

---

## Notes

- **File uploads**: Images are still saved on the backend's disk. On Render's free tier, the filesystem is temporary — uploads may be lost when the app restarts. For persistent images, you'd later migrate to Supabase Storage (separate guide).
- **Backend sleep**: On Render free tier, the backend sleeps after ~15 min of no traffic. The first request after sleep may take 30–60 seconds.
- **CORS**: If the frontend and backend are on different domains, you may need CORS configured. Check `backend/src/app.js` for `cors()` — it may already allow all origins.
