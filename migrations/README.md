# Database Migrations

This directory contains SQL scripts for setting up and modifying the database schema in Supabase.

## How to Apply Migrations

You can apply these migrations in several ways:

### Option 1: Using the Supabase Dashboard SQL Editor

1. Login to your Supabase dashboard
2. Go to the SQL Editor section
3. Create a new query
4. Copy and paste the SQL script content
5. Run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can apply migrations using:

```bash
supabase db push
```

## Migrations

- `create_hearings_table.sql`: Creates the hearings table with the required fields and sets up Row Level Security policies.

## Schema Information

### Hearings Table

The hearings table has the following structure:

| Column         | Type                       | Description                                        |
|----------------|----------------------------|----------------------------------------------------|
| id             | UUID                       | Primary key                                        |
| case_id        | UUID                       | Foreign key to cases table                         |
| court_name     | TEXT                       | Name of the court                                  |
| hearing_date   | TIMESTAMP WITH TIME ZONE   | Date and time of the hearing                       |
| participants   | TEXT[]                     | Array of participant names                         |
| outcome        | TEXT                       | Outcome of the hearing (optional)                  |
| created_at     | TIMESTAMP WITH TIME ZONE   | Automatically set on record creation               |
| updated_at     | TIMESTAMP WITH TIME ZONE   | Automatically updated on record modification       |

### Row Level Security

Row Level Security (RLS) policies have been set up to:

- Allow authenticated users to view all hearings
- Allow authenticated users to insert new hearings
- Allow authenticated users to update hearings
- Allow authenticated users to delete hearings

### Indexes

Indexes have been created on:

- `case_id`: For faster lookup of hearings by case
- `hearing_date`: For faster lookup of hearings by date