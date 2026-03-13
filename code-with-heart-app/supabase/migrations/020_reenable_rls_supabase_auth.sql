-- Migration: Re-enable RLS using Supabase native auth
--
-- Core fix: user.id references auth.users(id) so auth.uid() = user.id
-- throughout – making all existing RLS policies on feedback,
-- feedback_likes, and linkedin_accounts work correctly.
--
-- Apply with: supabase db reset

-- ─── 1. Link user.id → auth.users ────────────────────────────────────────────
-- Drop the gen_random_uuid() default; id must now be supplied as auth.uid()
ALTER TABLE "user" ALTER COLUMN id DROP DEFAULT;

-- Restore FK so the DB enforces the auth linkage
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_auth_id_fkey;
ALTER TABLE "user" ADD CONSTRAINT user_auth_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── 3. Fix user table RLS policies ──────────────────────────────────────────
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert only their own record (id must equal auth.uid())
DROP POLICY IF EXISTS "Users can insert their own user record" ON "user";
CREATE POLICY "Users can insert their own user record"
  ON "user" FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Authenticated users can update only their own record
DROP POLICY IF EXISTS "Users can update their own user record" ON "user";
CREATE POLICY "Users can update their own user record"
  ON "user" FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── 4. Re-enable feedback RLS ───────────────────────────────────────────────
-- Existing policies (sender_id = auth.uid(), recipient_id = auth.uid()) are
-- correct now that user.id = auth.uid().
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Add missing DELETE policy for senders
DROP POLICY IF EXISTS "Users can delete their own feedback" ON feedback;
CREATE POLICY "Users can delete their own feedback"
  ON feedback FOR DELETE TO authenticated
  USING (sender_id = auth.uid() AND status NOT IN ('delivered', 'published'));

-- ─── 5. Enable feedback_likes RLS ────────────────────────────────────────────
ALTER TABLE feedback_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON feedback_likes;
CREATE POLICY "Anyone can view likes"
  ON feedback_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can like" ON feedback_likes;
CREATE POLICY "Authenticated users can like"
  ON feedback_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove their own likes" ON feedback_likes;
CREATE POLICY "Users can remove their own likes"
  ON feedback_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
