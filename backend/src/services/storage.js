/**
 * Storage service: Supabase Storage (production) or local disk (dev when not configured)
 */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'classified-images';
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function isSupabaseStorage() {
  return Boolean(supabase);
}

/**
 * Upload a file. Returns the URL to use (Supabase public URL or relative path for local).
 * @param {Buffer} buffer - File buffer
 * @param {string} ext - File extension (e.g. '.jpg')
 * @param {string} classifiedId - Classified UUID
 * @returns {Promise<string>} - Full public URL or relative path
 */
async function uploadImage(buffer, ext, classifiedId) {
  const filename = `${require('crypto').randomUUID()}${ext}`;
  const storagePath = `classifieds/${classifiedId}/${filename}`;

  if (supabase) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: getMimeType(ext),
        upsert: false,
      });
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Failed to upload image');
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  // Local disk fallback
  const uploadsBase = path.join(__dirname, '..', '..', 'uploads');
  const dir = path.join(uploadsBase, 'classifieds', classifiedId);
  fs.mkdirSync(dir, { recursive: true });
  const absPath = path.join(dir, filename);
  fs.writeFileSync(absPath, buffer);
  return path.join('classifieds', classifiedId, filename).replace(/\\/g, '/');
}

/**
 * Delete an image. Accepts either full Supabase URL or relative path.
 */
async function deleteImage(filePathOrUrl) {
  if (!filePathOrUrl) return;

  if (filePathOrUrl.startsWith('http') && supabase) {
    try {
      const url = new URL(filePathOrUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const bucketIdx = pathParts.indexOf(BUCKET);
      if (bucketIdx >= 0 && pathParts.length > bucketIdx + 1) {
        const storagePath = pathParts.slice(bucketIdx + 1).join('/');
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
    return;
  }

  // Local disk
  const uploadsBase = path.join(__dirname, '..', '..', 'uploads');
  const absPath = path.join(uploadsBase, filePathOrUrl);
  if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
}

/**
 * Convert stored path/URL to display URL. If it's already a full URL, return as-is.
 * Otherwise prepend /api/uploads/ for local serving.
 */
function toDisplayUrl(filePathOrUrl) {
  if (!filePathOrUrl) return null;
  if (filePathOrUrl.startsWith('http')) return filePathOrUrl;
  return '/api/uploads/' + filePathOrUrl;
}

function getMimeType(ext) {
  const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  return mime[ext.toLowerCase()] || 'image/jpeg';
}

module.exports = { uploadImage, deleteImage, toDisplayUrl, isSupabaseStorage, BUCKET };
