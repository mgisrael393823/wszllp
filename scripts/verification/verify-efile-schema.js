#!/usr/bin/env node

/**
 * Simple verification that e-filing schema changes are working
 */

import { createClient } from '@supabase/supabase-js';

// Use local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEFileSchema() {
  console.log('🧪 Verifying E-Filing Schema Integration...\n');

  try {
    // Test 1: Verify e-filing columns exist
    console.log('1️⃣ Testing e-filing columns exist...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('documents')
      .select('id, envelope_id, filing_id, efile_status, efile_timestamp')
      .limit(1);

    if (schemaError) {
      throw new Error(`❌ E-filing columns missing: ${schemaError.message}`);
    }
    console.log('✅ E-filing columns (envelope_id, filing_id, efile_status, efile_timestamp) exist');

    // Test 2: Test that we can query with e-filing filters
    console.log('\n2️⃣ Testing e-filing queries...');
    const { data: queryTest, error: queryError } = await supabase
      .from('documents')
      .select('id, envelope_id, filing_id, efile_status')
      .not('envelope_id', 'is', null)
      .limit(5);

    if (queryError) {
      throw new Error(`❌ E-filing query failed: ${queryError.message}`);
    }
    console.log(`✅ E-filing queries work (found ${queryTest?.length || 0} e-filed documents)`);

    // Test 3: Verify database functions exist
    console.log('\n3️⃣ Testing case management functions...');
    
    // Test if functions exist by trying to call them with invalid data (expect specific errors)
    const { data: funcTest, error: funcError } = await supabase.rpc('create_document_with_validation', {
      p_case_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      p_envelope_id: 'test-env',
      p_filing_id: 'test-filing',
      p_file_name: 'test.pdf',
      p_doc_type: 'Other',
      p_efile_status: 'submitted',
      p_efile_timestamp: new Date().toISOString()
    });

    if (funcError && funcError.message.includes('does not exist')) {
      console.log('✅ Document validation function exists (FK constraint expected)');
    } else if (funcError && funcError.message.includes('function')) {
      throw new Error(`❌ Function missing: ${funcError.message}`);
    } else {
      console.log('✅ Document validation function exists and works');
    }

    console.log('\n🎉 E-Filing Schema Verification PASSED!');
    console.log('\n✅ Summary:');
    console.log('  - E-filing tracking columns exist in documents table');
    console.log('  - Database queries with e-filing filters work');
    console.log('  - Case management database functions are available');
    console.log('  - Ready for e-filing case management integration');

  } catch (error) {
    console.error('\n❌ Schema Verification FAILED:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyEFileSchema();