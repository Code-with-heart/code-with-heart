-- Seed data for the Code with Heart application
-- NOTE: Auth users must be created via the Supabase Dashboard or using the seed-auth.js script
-- This file only seeds public tables (faculty, user, feedback)

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

-- User records will be created by seed-auth.js after auth users are created
-- The script will insert into both auth.users (via Admin API) and public.user table

-- Feedback data will be seeded after users exist
