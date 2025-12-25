# Database Setup

This directory contains database migrations and seed data for the Code with Heart application.

## Setup Instructions

### 1. Apply the Migration

You have two options to apply the migration:

#### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project at https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `migrations/001_create_user_table.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### 2. Verify the Table

After running the migration, verify that the `user` table was created:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see a new table called `user`
3. Check that it has the following columns:
   - `id` (uuid, primary key)
   - `full_name` (text)
   - `email` (text)
   - `user_type` (user_type enum)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### 3. Add Test Data (Optional)

For testing the user selector:

1. Go to **Authentication > Users** in Supabase Dashboard
2. Create a few test users
3. Note their UUIDs
4. Go to **SQL Editor** and run:

```sql
INSERT INTO "user" (id, full_name, email, user_type) VALUES
  ('uuid-from-auth-user-1', 'Max Mustermann', 'max.mustermann@htwg-konstanz.de', 'Student'),
  ('uuid-from-auth-user-2', 'Anna Schmidt', 'anna.schmidt@htwg-konstanz.de', 'Student'),
  ('uuid-from-auth-user-3', 'Prof. Dr. Hans Meyer', 'hans.meyer@htwg-konstanz.de', 'Professor');
```

Replace the UUIDs with actual UUIDs from your auth users.

## Schema Details

### User Table

- **id**: UUID that references `auth.users.id` (automatically created by Supabase Auth)
- **full_name**: Full name of the user
- **email**: Email address (unique)
- **user_type**: One of: `Student`, `Professor`, `HTWG Employee`, `Lecturer`
- **created_at**: Timestamp when the profile was created
- **updated_at**: Timestamp when the profile was last updated (auto-updated)

### Indexes

- Fast searching by name, email, and user type
- Full-text search on names for better search performance

### Row Level Security (RLS)

- All authenticated users can view all users
- Users can only create/update their own user record
- Only admins can delete user records

## Next Steps

After setting up the database:

1. Ensure your `.env` file has the correct Supabase credentials
2. Create some test users in Supabase Auth
3. Add corresponding user records in the `user` table
4. Test the user selector in the feedback form
