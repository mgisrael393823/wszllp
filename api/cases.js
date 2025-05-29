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
    const {
      userId,
      jurisdiction,
      county,
      caseType,
      attorneyId,
      referenceId,
      // Phase A: Enhanced fields
      paymentAccountId,
      amountInControversy,
      showAmountInControversy,
      petitioner,
      defendants
    } = req.body;

    // Validate required fields
    const missing = [];
    if (!userId) missing.push('userId');
    if (!jurisdiction) missing.push('jurisdiction');
    if (!county) missing.push('county');
    if (!caseType) missing.push('caseType');
    if (!attorneyId) missing.push('attorneyId');
    if (!referenceId) missing.push('referenceId');

    if (missing.length) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: missing
      });
    }

    // Phase A: Enhanced validation
    if (amountInControversy && isNaN(parseFloat(amountInControversy))) {
      return res.status(400).json({ error: 'amountInControversy must be numeric' });
    }

    if (showAmountInControversy !== undefined && typeof showAmountInControversy !== 'boolean') {
      return res.status(400).json({ error: 'showAmountInControversy must be boolean' });
    }

    // Validate petitioner if provided
    if (petitioner) {
      if (petitioner.type === 'business' && !petitioner.businessName?.trim()) {
        return res.status(400).json({ error: 'Business name is required for business petitioner' });
      }
      if (petitioner.type === 'individual' && (!petitioner.firstName?.trim() || !petitioner.lastName?.trim())) {
        return res.status(400).json({ error: 'First and last name required for individual petitioner' });
      }
      if (!petitioner.addressLine1?.trim() || !petitioner.city?.trim() || !petitioner.state?.trim() || !petitioner.zipCode?.trim()) {
        return res.status(400).json({ error: 'Complete address required for petitioner' });
      }
      if (!/^\d{5}(-\d{4})?$/.test(petitioner.zipCode)) {
        return res.status(400).json({ error: 'Valid ZIP code required for petitioner' });
      }
    }

    // Validate defendants if provided
    if (defendants && Array.isArray(defendants)) {
      for (let i = 0; i < defendants.length; i++) {
        const defendant = defendants[i];
        if (!defendant.firstName?.trim() || !defendant.lastName?.trim()) {
          return res.status(400).json({ error: `First and last name required for defendant ${i + 1}` });
        }
        if (!defendant.addressLine1?.trim() || !defendant.city?.trim() || !defendant.state?.trim() || !defendant.zipCode?.trim()) {
          return res.status(400).json({ error: `Complete address required for defendant ${i + 1}` });
        }
        if (!/^\d{5}(-\d{4})?$/.test(defendant.zipCode)) {
          return res.status(400).json({ error: `Valid ZIP code required for defendant ${i + 1}` });
        }
      }
    }

    // Begin atomic transaction with enhanced fields
    const { data, error } = await supabase.rpc('create_case_with_transaction', {
      p_user_id: userId,
      p_jurisdiction: jurisdiction,
      p_county: county,
      p_case_type: caseType,
      p_attorney_id: attorneyId,
      p_reference_id: referenceId,
      // Phase A: Enhanced parameters
      p_payment_account_id: paymentAccountId || null,
      p_amount_in_controversy: amountInControversy ? parseFloat(amountInControversy) : null,
      p_show_amount_in_controversy: showAmountInControversy || false,
      p_petitioner: petitioner ? JSON.stringify(petitioner) : null,
      p_defendants: defendants ? JSON.stringify(defendants) : JSON.stringify([]),
      p_status: 'Open',
      p_case_category: '7'
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