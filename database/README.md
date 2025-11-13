# Database - Smart Glass AI

## Overview

The database component uses Supabase, a PostgreSQL-based backend-as-a-service platform, to provide authentication, data persistence, and file storage for the Smart Glass AI system. This folder contains configuration files, setup instructions, and database schema documentation.

## Contents

This folder contains:

- **.env.example**: Template for Supabase connection credentials
- **schema.sql**: Database schema definitions (to be created)
- **README.md**: This file with setup instructions

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:

- **PostgreSQL Database**: Reliable relational database
- **Authentication**: User authentication and authorization
- **Storage**: File storage with CDN
- **Real-time**: Real-time database subscriptions
- **Auto-generated APIs**: RESTful and GraphQL APIs

## Prerequisites

- A Supabase account (free tier available)
- Web browser for Supabase dashboard access

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in project details:
   - **Name**: smart-glass-ai (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your location
   - **Pricing Plan**: Free tier is sufficient for development
5. Click "Create new project"
6. Wait for project initialization (1-2 minutes)

### 2. Get API Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this secret!)

### 3. Configure Environment Variables

Create a `.env` file in the database folder:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Important**: 
- Never commit the `.env` file to version control
- The `.env.example` file should only contain placeholders
- Copy these credentials to your backend `.env` file as well

### 4. Create Database Tables

1. In Supabase dashboard, go to **SQL Editor** (in sidebar)
2. Click "New query"
3. Copy and paste the following SQL schema:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create face_encodings table
CREATE TABLE face_encodings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encoding JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_id ON face_encodings(user_id);
CREATE INDEX idx_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL
5. Verify tables were created in **Table Editor** section

### 5. Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage** (in sidebar)
2. Click "Create a new bucket"
3. Configure bucket:
   - **Name**: `face-images`
   - **Public bucket**: Enable (so images can be accessed via URL)
4. Click "Create bucket"

### 6. Configure Storage Policies (Optional)

For development, the public bucket is sufficient. For production, you may want to add Row Level Security (RLS) policies:

```sql
-- Allow public read access to face images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'face-images' AND auth.role() = 'authenticated');
```

## Database Schema

### users Table

Stores user information and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | User's email (unique) |
| phone | VARCHAR(50) | User's phone number (optional) |
| image_url | TEXT | URL to stored face image |
| created_at | TIMESTAMP | Registration timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### face_encodings Table

Stores facial feature encodings for recognition.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| user_id | UUID | Foreign key to users table |
| encoding | JSONB | Face encoding array (128 dimensions) |
| created_at | TIMESTAMP | Encoding creation timestamp |

**Relationships:**
- `face_encodings.user_id` → `users.id` (CASCADE DELETE)

## Storage Structure

### face-images Bucket

Stores uploaded face images with the following structure:

```
face-images/
├── {user_id}_original.jpg    # Original uploaded image
└── {user_id}_processed.jpg   # Processed/resized image (optional)
```

**File naming convention:**
- Format: `{user_id}_{timestamp}.{extension}`
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890_1699876543.jpg`

## Accessing the Database

### Via Supabase Dashboard

1. Go to **Table Editor** to view and edit data
2. Use **SQL Editor** for custom queries
3. Check **Database** → **Roles** for user management

### Via Backend API

The backend uses the Supabase Python client to interact with the database:

```python
from supabase import create_client

supabase = create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_KEY")
)

# Insert user
user = supabase.table("users").insert({
    "name": "John Doe",
    "email": "john@example.com"
}).execute()

# Query users
users = supabase.table("users").select("*").execute()
```

## Data Management

### Backup

Supabase automatically backs up your database. To create manual backups:

1. Go to **Database** → **Backups** in dashboard
2. Click "Create backup"
3. Download backup file if needed

### Restore

To restore from backup:

1. Go to **Database** → **Backups**
2. Select backup to restore
3. Click "Restore"

### Export Data

To export data as CSV:

1. Go to **Table Editor**
2. Select table
3. Click "Export" → "CSV"

## Security Best Practices

### Row Level Security (RLS)

For production, enable RLS on tables:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

### API Key Management

- **anon key**: Safe to use in frontend (limited permissions)
- **service_role key**: Use only in backend (full permissions)
- Never expose service_role key in client-side code
- Rotate keys if compromised (Project Settings → API)

### Environment Variables

- Store credentials in `.env` files
- Never commit `.env` to version control
- Use different credentials for development/production
- Restrict access to production credentials

## Monitoring

### Database Usage

Monitor your database usage in Supabase dashboard:

1. Go to **Settings** → **Usage**
2. Check:
   - Database size
   - API requests
   - Storage usage
   - Bandwidth

### Query Performance

Use the SQL Editor to analyze slow queries:

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Connection Issues

- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check project is not paused (free tier pauses after inactivity)
- Ensure network allows connections to Supabase
- Check Supabase status: https://status.supabase.com

### Table Creation Errors

- Ensure UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Check for syntax errors in SQL
- Verify you have proper permissions

### Storage Upload Failures

- Check bucket exists and is public
- Verify file size limits (default 50MB)
- Ensure proper file permissions
- Check storage quota hasn't been exceeded

### Performance Issues

- Add indexes on frequently queried columns
- Use connection pooling in backend
- Optimize queries (avoid SELECT *)
- Consider upgrading plan for more resources

## Migration Guide

If you need to migrate data or schema:

### Export Schema

```bash
# Using Supabase CLI
supabase db dump --schema public > schema.sql
```

### Import Schema

```bash
# Using Supabase CLI
supabase db reset
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f schema.sql
```

## Supabase CLI (Optional)

For advanced users, install Supabase CLI:

```bash
# Install via npm
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-id

# Pull remote schema
supabase db pull
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For Supabase-specific issues:
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase Support](https://supabase.com/support)
