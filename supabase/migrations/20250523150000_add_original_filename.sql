-- Add original_filename column to documents table for better UX
ALTER TABLE public.documents 
ADD COLUMN original_filename TEXT;

-- Update existing documents to extract filename from file_url
UPDATE public.documents 
SET original_filename = 
  CASE 
    WHEN file_url IS NOT NULL THEN 
      SUBSTRING(file_url FROM '[^/]*$')
    ELSE 
      'unknown_document'
  END
WHERE original_filename IS NULL;