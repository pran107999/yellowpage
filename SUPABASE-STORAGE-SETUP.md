# Supabase Storage Setup for Images

Images are stored in Supabase Storage so they persist (unlike Render's ephemeral disk).

## Step 1: Create the storage bucket

1. Go to **https://supabase.com/dashboard** → your project
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. **Name:** `classified-images`
5. **Public bucket:** Check this (so images can be viewed without auth)
6. Click **Create bucket**

## Step 2: Set bucket policies (optional)

The bucket is public, so files are readable by anyone. For uploads, the backend uses the **service role** key, which bypasses RLS. If you want to restrict uploads, add a policy—but for this app, the default is fine.

## Step 3: Get your Supabase credentials

1. In Supabase, go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://bhuuezgygohmxnzvzdms.supabase.co`)
   - **service_role** key (under "Project API keys" — **never expose this in the frontend**)

## Step 4: Add env vars

**Local (backend/.env):**
```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Render:**
1. Dashboard → your backend service → **Environment**
2. Add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_KEY` = your service_role key
3. **Save changes** (triggers redeploy)

## Step 5: Redeploy

Push your code and let Render redeploy, or manually redeploy from the Render dashboard.

---

**Note:** If `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are not set, the app falls back to local disk storage (fine for local dev, but images won't persist on Render).
