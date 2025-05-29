import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for server-side operations');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate required fields
    const { 
      caseId, 
      envelopeId, 
      filingId, 
      fileName, 
      docType, 
      status, 
      timestamp 
    } = req.body;

    if (!caseId || !envelopeId || !filingId || !fileName || !docType || !status || !timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['caseId', 'envelopeId', 'filingId', 'fileName', 'docType', 'status', 'timestamp']
      });
    }

    // Validate UUID format for caseId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(caseId)) {
      return res.status(400).json({ 
        error: 'Invalid caseId format. Must be a valid UUID.' 
      });
    }

    // Validate timestamp format
    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid timestamp format. Must be a valid ISO 8601 date string.' 
      });
    }

    // Call atomic database function with validation
    const { data, error } = await supabase.rpc('create_document_with_validation', {
      p_case_id: caseId,
      p_envelope_id: envelopeId,
      p_filing_id: filingId,
      p_file_name: fileName,
      p_doc_type: docType,
      p_efile_status: status,
      p_efile_timestamp: timestamp
    });

    if (error) {
      console.error('Database error creating document:', error);
      
      // Handle specific database errors
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ 
          error: 'Case not found',
          details: 'The specified caseId does not exist'
        });
      }
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Duplicate document',
          details: 'A document with this envelope ID and filing ID already exists'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to create document',
        details: error.message 
      });
    }

    // Return the created document with documentId
    return res.status(201).json({
      success: true,
      documentId: data,
      message: 'Document created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in /api/documents:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}