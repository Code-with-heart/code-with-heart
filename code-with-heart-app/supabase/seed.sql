-- Seed data for the Code with Heart application
-- Auth users are created here via direct SQL (local dev only – no service role key needed).

-- Create faculties
INSERT INTO faculty (id, name, abbreviation, description, color) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Architektur und Gestaltung',
    'AuG',
    'Fakultät für Architektur und Gestaltung',
    '#FF6B6B'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Bauingenieurwesen',
    'BAU',
    'Fakultät für Bauingenieurwesen',
    '#4ECDC4'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Elektrotechnik und Informationstechnik',
    'EI',
    'Fakultät für Elektrotechnik und Informationstechnik',
    '#FFE66D'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Informatik',
    'INF',
    'Fakultät für Informatik',
    '#95E1D3'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Maschinenbau',
    'MB',
    'Fakultät für Maschinenbau',
    '#F38181'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Wirtschafts-, Kultur- und Rechtswissenschaften',
    'WKR',
    'Fakultät für Wirtschafts-, Kultur- und Rechtswissenschaften',
    '#AA96DA'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Auth users (local dev only) ────────────────────────────────────────────
-- UUIDs are fixed so the public.user inserts below can reference them.
-- Password for all accounts: password123

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'max.mustermann@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Max Mustermann"}'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'anna.schmidt@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Anna Schmidt"}'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'hans.meyer@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Prof. Dr. Hans Meyer"}'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sarah.weber@htwg-konstanz.de',
    crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sarah Weber"}'
  )
ON CONFLICT (id) DO NOTHING;

-- Required identity rows (Supabase Auth checks these)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'max.mustermann@htwg-konstanz.de', 'email',
    '{"sub":"20000000-0000-0000-0000-000000000001","email":"max.mustermann@htwg-konstanz.de"}',
    NOW(), NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'anna.schmidt@htwg-konstanz.de', 'email',
    '{"sub":"20000000-0000-0000-0000-000000000002","email":"anna.schmidt@htwg-konstanz.de"}',
    NOW(), NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    'hans.meyer@htwg-konstanz.de', 'email',
    '{"sub":"20000000-0000-0000-0000-000000000003","email":"hans.meyer@htwg-konstanz.de"}',
    NOW(), NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004',
    'sarah.weber@htwg-konstanz.de', 'email',
    '{"sub":"20000000-0000-0000-0000-000000000004","email":"sarah.weber@htwg-konstanz.de"}',
    NOW(), NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Public app users ────────────────────────────────────────────────────────
-- id must match auth.users.id so RLS (auth.uid() = id) works.

INSERT INTO "user" (id, full_name, email, user_type, faculty_id, oidc_sub, tos_accepted_at, data_processing_accepted_at) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Max Mustermann',
    'max.mustermann@htwg-konstanz.de',
    'Student',
    '10000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Anna Schmidt',
    'anna.schmidt@htwg-konstanz.de',
    'Student',
    '10000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Prof. Dr. Hans Meyer',
    'hans.meyer@htwg-konstanz.de',
    'Professor',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    NOW(), NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Sarah Weber',
    'sarah.weber@htwg-konstanz.de',
    'HTWG Employee',
    '10000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000004',
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Sample feedback ─────────────────────────────────────────────────────────

INSERT INTO feedback (sender_id, recipient_id, original_text, status, is_published) VALUES
  (
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Great work on the group project! Your contributions were very helpful.',
    'delivered', FALSE
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Your presentation was well-structured and informative. Keep up the good work!',
    'published', TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    'Nice collaboration during the workshop. Your ideas were innovative.',
    'delivered', FALSE
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Thank you for your support during the exam preparation. Your notes were really helpful!',
    'published', TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'The lecture series on software architecture was excellent. Very practical examples!',
    'delivered', FALSE
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    'Thank you for the detailed feedback on my thesis. It was very helpful!',
    'published', TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'Great teamwork on the research project!',
    'published', TRUE
  )
ON CONFLICT DO NOTHING;
