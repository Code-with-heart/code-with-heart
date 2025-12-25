-- Seed data for testing the user table
-- This creates both auth users and corresponding user records

-- Create test auth users (only works with service_role key or in local development)
-- Note: In production, use Supabase Dashboard to create auth users

-- For local development with supabase CLI:
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'max.mustermann@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'anna.schmidt@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'hans.meyer@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'sarah.weber@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'thomas.bauer@external.de',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- Create identities for each user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"max.mustermann@htwg-konstanz.de"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"anna.schmidt@htwg-konstanz.de"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"hans.meyer@htwg-konstanz.de"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '{"sub":"00000000-0000-0000-0000-000000000004","email":"sarah.weber@htwg-konstanz.de"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    '{"sub":"00000000-0000-0000-0000-000000000005","email":"thomas.bauer@external.de"}',
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Now create the user records
INSERT INTO "user" (id, full_name, email, user_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Max Mustermann', 'max.mustermann@htwg-konstanz.de', 'Student'),
  ('00000000-0000-0000-0000-000000000002', 'Anna Schmidt', 'anna.schmidt@htwg-konstanz.de', 'Student'),
  ('00000000-0000-0000-0000-000000000003', 'Prof. Dr. Hans Meyer', 'hans.meyer@htwg-konstanz.de', 'Professor'),
  ('00000000-0000-0000-0000-000000000004', 'Sarah Weber', 'sarah.weber@htwg-konstanz.de', 'HTWG Employee'),
  ('00000000-0000-0000-0000-000000000005', 'Dr. Thomas Bauer', 'thomas.bauer@external.de', 'Lecturer')
ON CONFLICT (id) DO NOTHING;
