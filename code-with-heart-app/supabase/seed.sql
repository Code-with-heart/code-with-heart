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

-- Create feedback data for testing
-- Max Mustermann (user 1) receives feedback from others
INSERT INTO feedback (
  sender_id,
  recipient_id,
  original_text,
  modified_text,
  status,
  is_published,
  created_at,
  delivered_at,
  published_at
) VALUES
  -- Received feedback (delivered to Max)
  (
    '00000000-0000-0000-0000-000000000002', -- Anna Schmidt
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    'Great work on the group project! Your contributions were very helpful.',
    NULL,
    'delivered',
    false,
    now() - interval '5 days',
    now() - interval '5 days',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000003', -- Prof. Dr. Hans Meyer
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    'Your presentation was well-structured and informative. Keep up the good work!',
    NULL,
    'published',
    true,
    now() - interval '10 days',
    now() - interval '10 days',
    now() - interval '8 days'
  ),
  (
    '00000000-0000-0000-0000-000000000004', -- Sarah Weber
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    'Nice collaboration during the workshop. Your ideas were innovative.',
    NULL,
    'delivered',
    false,
    now() - interval '3 days',
    now() - interval '3 days',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000005', -- Dr. Thomas Bauer
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    'Your code review comments were thorough and constructive. Much appreciated!',
    NULL,
    'published',
    true,
    now() - interval '15 days',
    now() - interval '15 days',
    now() - interval '12 days'
  ),

  -- Sent feedback (from Max to others)
  (
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    '00000000-0000-0000-0000-000000000002', -- Anna Schmidt
    'Thank you for your support during the exam preparation. Your notes were really helpful!',
    NULL,
    'published',
    true,
    now() - interval '7 days',
    now() - interval '7 days',
    now() - interval '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    '00000000-0000-0000-0000-000000000003', -- Prof. Dr. Hans Meyer
    'The lecture series on software architecture was excellent. Very practical examples!',
    NULL,
    'delivered',
    false,
    now() - interval '12 days',
    now() - interval '12 days',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    '00000000-0000-0000-0000-000000000004', -- Sarah Weber
    'Great job organizing the student event. Everything ran smoothly!',
    NULL,
    'delivered',
    false,
    now() - interval '4 days',
    now() - interval '4 days',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001', -- Max Mustermann
    '00000000-0000-0000-0000-000000000002', -- Anna Schmidt
    'Your presentation skills have improved significantly. Well done!',
    NULL,
    'delivered',
    false,
    now() - interval '2 days',
    now() - interval '2 days',
    NULL
  ),

  -- Additional feedback between other users (for the public feed)
  (
    '00000000-0000-0000-0000-000000000002', -- Anna Schmidt
    '00000000-0000-0000-0000-000000000003', -- Prof. Dr. Hans Meyer
    'Thank you for the detailed feedback on my thesis. It was very helpful!',
    NULL,
    'published',
    true,
    now() - interval '20 days',
    now() - interval '20 days',
    now() - interval '18 days'
  ),
  (
    '00000000-0000-0000-0000-000000000004', -- Sarah Weber
    '00000000-0000-0000-0000-000000000002', -- Anna Schmidt
    'Great teamwork on the research project!',
    NULL,
    'published',
    true,
    now() - interval '14 days',
    now() - interval '14 days',
    now() - interval '13 days'
  )
ON CONFLICT DO NOTHING;
