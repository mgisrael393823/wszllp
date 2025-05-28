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
      paymentAccountId,
      amountInControversy,
      showAmountInControversy,
      petitioner,
      defendants
    } = req.body;

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

    if (amountInControversy && isNaN(parseFloat(amountInControversy))) {
      return res.status(400).json({ error: 'amountInControversy must be numeric' });
    }

    if (showAmountInControversy !== undefined && typeof showAmountInControversy !== 'boolean') {
      return res.status(400).json({ error: 'showAmountInControversy must be boolean' });
    }

    const validateAddress = (p) => {
      const addrFields = ['addressLine1', 'city', 'state', 'zipCode'];
      for (const f of addrFields) {
        if (!p?.[f]) return `Missing ${f}`;
      }
      if (p.type === 'business' && !p.businessName) return 'Missing businessName';
      if (p.type === 'individual' && (!p.firstName || !p.lastName)) return 'Missing name';
      return null;
    };

    if (petitioner) {
      const petErr = validateAddress(petitioner);
      if (petErr) return res.status(400).json({ error: `Petitioner: ${petErr}` });
    }

    if (defendants) {
      if (!Array.isArray(defendants)) {
        return res.status(400).json({ error: 'defendants must be an array' });
      }
      for (const d of defendants) {
        const defErr = validateAddress({ ...d, type: 'individual' });
        if (defErr) return res.status(400).json({ error: `Defendant: ${defErr}` });
      }
    }

    // Begin atomic transaction
    const { data, error } = await supabase.rpc('create_case_with_transaction', {
      p_user_id: userId,
      p_jurisdiction: jurisdiction,
      p_county: county,
      p_case_type: caseType,
      p_attorney_id: attorneyId,
      p_reference_id: referenceId,
      p_payment_account_id: paymentAccountId || null,
      p_amount_in_controversy: amountInControversy || null,
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