-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor → New query
-- Copy and paste the entire content below, then click Run (or Cmd+Enter)

-- 1. Email verification columns (if not already in schema)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP;

-- 2. Password reset columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

-- 3. Classified images table
CREATE TABLE IF NOT EXISTS classified_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_classified_images_classified_id ON classified_images(classified_id);
