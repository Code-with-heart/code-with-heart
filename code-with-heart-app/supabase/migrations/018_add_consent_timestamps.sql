-- Add consent timestamp columns to user table
-- tos_accepted_at: when the user accepted the Terms of Service
-- data_processing_accepted_at: when the user accepted the data processing notice

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_processing_accepted_at TIMESTAMPTZ;
