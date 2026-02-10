# Images Not Showing — Troubleshooting

## Quick checks

### 1. Verify storage is configured (Render)

Open:
```
https://desinetwork.onrender.com/api/health
```

Expected response:
```json
{"status":"ok","storage":"supabase"}
```

If you see `"storage":"local (images may not persist on Render)"` → Supabase Storage is **not** configured. See step 2.

---

### 2. Add Supabase Storage to Render

1. **Create the bucket** in Supabase:
   - Dashboard → Storage → New bucket
   - Name: `classified-images` (exact spelling)
   - **Public bucket:** ON

2. **Get the service role key**:
   - Supabase → Settings → API → Project API keys
   - Copy the **service_role** key (click Reveal)

3. **Add to Render**:
   - Render → your backend → Environment
   - Add:
     - `SUPABASE_URL` = `https://bhuuezgygohmxnzvzdms.supabase.co` (your project URL)
     - `SUPABASE_SERVICE_KEY` = your service_role key
   - Save (triggers redeploy)

---

### 3. Re-upload images

Existing classifieds with images stored on Render's disk are lost. You must:

1. Edit the classified
2. Re-add the images
3. Save

New uploads will go to Supabase Storage.

---

### 4. Test a new classified

1. Create a new classified
2. Add 1–2 images
3. Publish
4. Open the classified detail page

If images still don’t show:
- Check the browser DevTools → Network tab for failed requests
- Check the image URL: it should start with `https://...supabase.co/storage/...`

---

## Common issues

| Issue | Fix |
|-------|-----|
| `storage: "local"` in /api/health | Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Render |
| Bucket not found | Create `classified-images` bucket in Supabase |
| 404 on image URL | Bucket may not be public; enable "Public bucket" |
| Old images broken | Re-upload; old files were on Render’s ephemeral disk |
