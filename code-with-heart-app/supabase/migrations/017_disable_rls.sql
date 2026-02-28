-- Migration: Disable all RLS policies on all tables
-- Add more tables if needed
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "faculty" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "linkedin_accounts" DISABLE ROW LEVEL SECURITY;
-- If you have more tables with RLS, add them below
