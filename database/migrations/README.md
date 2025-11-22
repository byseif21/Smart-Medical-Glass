# Database Migrations (Local Only)

This folder contains migration files for updating existing databases. 

**Note:** This folder is gitignored - migrations are for local development only.

## Usage

Migration files help you update your existing database without losing data.

### For New Databases
Use `database/supabase-schema.sql` instead - it has everything.

### For Existing Databases
Apply migration files in order (001, 002, etc.) via Supabase SQL Editor.

## Auto-Detection

The backend checks your schema on startup and shows instructions if updates are needed.
