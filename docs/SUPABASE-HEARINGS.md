# Supabase Integration for Hearings

This document describes how the Hearings feature uses Supabase for data storage and retrieval.

## Table Structure

We've created a `hearings` table in Supabase with the following structure:

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

## Supabase Integration

### Authentication

The application uses Supabase authentication to ensure that only authenticated users can access the hearings data. The Supabase client is initialized in `src/lib/supabaseClient.ts`.

### Data Operations

The following operations are supported:

#### Fetching Hearings

```typescript
const fetchHearings = async () => {
  const { data, error } = await supabase
    .from('hearings')
    .select(`
      id,
      case_id,
      court_name,
      hearing_date,
      participants,
      outcome,
      created_at,
      updated_at
    `);
    
  if (error) {
    console.error('Error fetching hearings:', error);
    return [];
  }
  
  return data;
};
```

#### Creating a Hearing

```typescript
const createHearing = async (hearing) => {
  const { error } = await supabase
    .from('hearings')
    .insert({
      id: uuidv4(), // Generate a new UUID
      case_id: hearing.caseId,
      court_name: hearing.courtName,
      hearing_date: hearing.hearingDate,
      participants: hearing.participants || [],
      outcome: hearing.outcome || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
  if (error) {
    console.error('Error creating hearing:', error);
    return false;
  }
  
  return true;
};
```

#### Updating a Hearing

```typescript
const updateHearing = async (hearingId, updates) => {
  const { error } = await supabase
    .from('hearings')
    .update({
      case_id: updates.caseId,
      court_name: updates.courtName,
      hearing_date: updates.hearingDate,
      participants: updates.participants || [],
      outcome: updates.outcome || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', hearingId);
    
  if (error) {
    console.error('Error updating hearing:', error);
    return false;
  }
  
  return true;
};
```

#### Deleting a Hearing

```typescript
const deleteHearing = async (hearingId) => {
  const { error } = await supabase
    .from('hearings')
    .delete()
    .eq('id', hearingId);
    
  if (error) {
    console.error('Error deleting hearing:', error);
    return false;
  }
  
  return true;
};
```

## Row Level Security (RLS)

Row Level Security policies have been implemented to ensure data security:

- Only authenticated users can view, create, update, or delete hearings
- Users can only access hearings related to cases they have access to

## Future Enhancements

1. Add pagination for large datasets
2. Add real-time updates using Supabase's real-time features
3. Implement more granular access control based on user roles
4. Add full-text search capabilities for finding hearings