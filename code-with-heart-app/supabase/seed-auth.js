/**
 * Seed script to create auth users and related data
 *
 * Usage:
 *   node supabase/seed-auth.js
 *
 * Required environment variables in .env file:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your service role key (from Supabase Dashboard > Settings > API)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_PASSWORD = 'password123';

const users = [
  {
    email: 'max.mustermann@htwg-konstanz.de',
    full_name: 'Max Mustermann',
    user_type: 'Student',
    faculty_id: '10000000-0000-0000-0000-000000000004' // Informatik
  },
  {
    email: 'anna.schmidt@htwg-konstanz.de',
    full_name: 'Anna Schmidt',
    user_type: 'Student',
    faculty_id: '10000000-0000-0000-0000-000000000004' // Informatik
  },
  {
    email: 'hans.meyer@htwg-konstanz.de',
    full_name: 'Prof. Dr. Hans Meyer',
    user_type: 'Professor',
    faculty_id: '10000000-0000-0000-0000-000000000002' // Bauingenieurwesen
  },
  {
    email: 'sarah.weber@htwg-konstanz.de',
    full_name: 'Sarah Weber',
    user_type: 'HTWG Employee',
    faculty_id: '10000000-0000-0000-0000-000000000006' // WKR
  },
  {
    email: 'thomas.bauer@external.de',
    full_name: 'Dr. Thomas Bauer',
    user_type: 'Lecturer',
    faculty_id: null // External
  }
];

async function seedUsers() {
  console.log('Starting user seed...\n');

  const createdUsers = [];

  for (const userData of users) {
    console.log(`Creating user: ${userData.email}`);

    // Create auth user using Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: TEST_PASSWORD,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  User already exists, fetching...`);
        // Get existing user
        const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.find(u => u.email === userData.email);
        if (existingUser) {
          createdUsers.push({ ...userData, id: existingUser.id });
          console.log(`  Found existing user: ${existingUser.id}`);

          // Make sure user record exists in public.user
          const { error: userError } = await supabase
            .from('user')
            .upsert({
              id: existingUser.id,
              full_name: userData.full_name,
              email: userData.email,
              user_type: userData.user_type,
              faculty_id: userData.faculty_id
            });
          if (!userError) {
            console.log(`  Ensured user record exists in public.user`);
          }
        }
        continue;
      }
      console.error(`  Error creating auth user: ${authError.message}`);
      continue;
    }

    console.log(`  Created auth user: ${authUser.user.id}`);
    createdUsers.push({ ...userData, id: authUser.user.id });

    // Create user record in public.user table
    const { error: userError } = await supabase
      .from('user')
      .upsert({
        id: authUser.user.id,
        full_name: userData.full_name,
        email: userData.email,
        user_type: userData.user_type,
        faculty_id: userData.faculty_id
      });

    if (userError) {
      console.error(`  Error creating user record: ${userError.message}`);
    } else {
      console.log(`  Created user record in public.user`);
    }
  }

  return createdUsers;
}

async function seedFeedback(users) {
  console.log('\nSeeding feedback data...\n');

  const getUserByEmail = (email) => users.find(u => u.email === email);

  const max = getUserByEmail('max.mustermann@htwg-konstanz.de');
  const anna = getUserByEmail('anna.schmidt@htwg-konstanz.de');
  const hans = getUserByEmail('hans.meyer@htwg-konstanz.de');
  const sarah = getUserByEmail('sarah.weber@htwg-konstanz.de');
  const thomas = getUserByEmail('thomas.bauer@external.de');

  if (!max || !anna || !hans || !sarah || !thomas) {
    console.error('Not all users were created, skipping feedback seed');
    return;
  }

  const feedbackData = [
    // Received feedback (delivered to Max)
    {
      sender_id: anna.id,
      recipient_id: max.id,
      original_text: 'Great work on the group project! Your contributions were very helpful.',
      status: 'delivered',
      is_published: false
    },
    {
      sender_id: hans.id,
      recipient_id: max.id,
      original_text: 'Your presentation was well-structured and informative. Keep up the good work!',
      status: 'published',
      is_published: true
    },
    {
      sender_id: sarah.id,
      recipient_id: max.id,
      original_text: 'Nice collaboration during the workshop. Your ideas were innovative.',
      status: 'delivered',
      is_published: false
    },
    {
      sender_id: thomas.id,
      recipient_id: max.id,
      original_text: 'Your code review comments were thorough and constructive. Much appreciated!',
      status: 'published',
      is_published: true
    },
    // Sent feedback (from Max to others)
    {
      sender_id: max.id,
      recipient_id: anna.id,
      original_text: 'Thank you for your support during the exam preparation. Your notes were really helpful!',
      status: 'published',
      is_published: true
    },
    {
      sender_id: max.id,
      recipient_id: hans.id,
      original_text: 'The lecture series on software architecture was excellent. Very practical examples!',
      status: 'delivered',
      is_published: false
    },
    {
      sender_id: max.id,
      recipient_id: sarah.id,
      original_text: 'Great job organizing the student event. Everything ran smoothly!',
      status: 'delivered',
      is_published: false
    },
    // Additional feedback between other users
    {
      sender_id: anna.id,
      recipient_id: hans.id,
      original_text: 'Thank you for the detailed feedback on my thesis. It was very helpful!',
      status: 'published',
      is_published: true
    },
    {
      sender_id: sarah.id,
      recipient_id: anna.id,
      original_text: 'Great teamwork on the research project!',
      status: 'published',
      is_published: true
    }
  ];

  for (const feedback of feedbackData) {
    const { error } = await supabase.from('feedback').insert(feedback);
    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log(`Feedback already exists, skipping...`);
      } else {
        console.error(`Error inserting feedback: ${error.message}`);
      }
    } else {
      console.log(`Created feedback: ${feedback.sender_id.slice(0, 8)}... -> ${feedback.recipient_id.slice(0, 8)}...`);
    }
  }
}

async function main() {
  try {
    const createdUsers = await seedUsers();
    await seedFeedback(createdUsers);
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('\nTest accounts (all use password: password123):');
    for (const user of users) {
      console.log(`  - ${user.email}`);
    }
    console.log('');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
