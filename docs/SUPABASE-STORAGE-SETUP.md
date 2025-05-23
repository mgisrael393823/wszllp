# Supabase Storage Setup for Document Upload

This guide covers the required Supabase configuration for the document upload functionality.

## Prerequisites

- Supabase project created
- Environment variables configured in `.env.local`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Required Setup Steps

### 1. Create Documents Storage Bucket

#### Option A: Via SQL Editor
1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

#### Option B: Via Dashboard UI
1. Go to **Storage** in Supabase Dashboard
2. Click **"New Bucket"**
3. Bucket name: `documents`
4. **Public bucket**: ✅ (checked)
5. Click **Create bucket**

### 2. Configure Storage Policies

Go to **Storage > Policies** and create these policies:

#### Allow Public Downloads
```sql
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'documents');
```

#### Allow Authenticated Uploads
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');
```

#### Allow Authenticated Deletes
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents');
```

### 3. Test the Setup

Run the test script to verify everything is working:

```bash
npm run test:storage
# or
node scripts/test-supabase-storage.js
```

## Expected File Structure

After setup, uploaded documents will be stored as:
```
documents/
├── 1234567890-abc123.pdf
├── 1234567891-def456.docx
└── 1234567892-ghi789.doc
```

## File Upload Flow

1. **Client uploads file** → Supabase Storage `documents/` bucket
2. **Get public URL** → Store in `documents.file_url` column
3. **Create database record** → Insert into `public.documents` table

## Troubleshooting

### Bucket Not Found Error
- Ensure the `documents` bucket exists
- Check bucket name spelling (case-sensitive)

### Upload Permission Denied
- Verify storage policies are created
- Check authentication status
- Ensure `authenticated` role has INSERT permissions

### Download/Access Issues  
- Verify bucket is marked as `public`
- Check SELECT policy exists for `public` role

### File Size Limits
- Default Supabase limit: 50MB
- Application limit: 10MB (configurable in `DocumentUploadForm.tsx`)

## Security Considerations

- Files are stored with random names to prevent guessing
- Only authenticated users can upload
- All users can download (suitable for legal documents that may be served publicly)
- File type validation prevents malicious uploads

## File Types Supported

- **PDF**: `application/pdf`
- **Word Doc**: `application/msword`  
- **Word DocX**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Storage Costs

Supabase Storage pricing (as of 2024):
- **Free tier**: 1GB storage
- **Pro**: $0.021 per GB per month
- **Bandwidth**: $0.09 per GB

Legal documents are typically small, so costs should be minimal.