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
    const { userId, jurisdiction, county, caseType, attorneyId, referenceId } = req.body;

    if (!userId || !jurisdiction || !county || !caseType || !attorneyId || !referenceId) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['userId', 'jurisdiction', 'county', 'caseType', 'attorneyId', 'referenceId']
      });
    }

    // Begin atomic transaction
    const { data, error } = await supabase.rpc('create_case_with_transaction', {
      p_user_id: userId,
      p_jurisdiction: jurisdiction,
      p_county: county,
      p_case_type: caseType,
      p_attorney_id: attorneyId,
      p_reference_id: referenceId,
      p_status: 'Open',
      p_case_category: '7' // Hardcoded for evictions as per existing logic
    });

    if (error) {
      console.error('Database error creating case:', error);
      return res.status(500).json({ 
        error: 'Failed to create case',
        details: error.message 
      });
    }

    // Return the created case with caseId
    return res.status(201).json({
      success: true,
      caseId: data,
      message: 'Case created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in /api/cases:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}