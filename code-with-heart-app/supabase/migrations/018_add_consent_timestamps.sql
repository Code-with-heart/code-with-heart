-- Add consent timestamp columns to user table
-- tos_accepted_at: when the user accepted the Terms of Service
-- data_processing_accepted_at: when the user accepted the data processing notice
--
-- NOTE: Existing users will have NULL values for both columns after this migration,
-- which means they will be prompted to re-consent on their next login.
-- This is intentional: these are newly introduced Terms of Service and Data
-- Privacy requirements, and explicit opt-in consent is required from all users —
-- including those who registered before this migration — to comply with applicable
-- data-protection regulations (e.g. GDPR). A NULL timestamp should be interpreted
-- as "consent not yet given", never as implied consent.

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_processing_accepted_at TIMESTAMPTZ;
