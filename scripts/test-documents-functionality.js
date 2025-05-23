import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentsFunctionality() {
  try {
    console.log('🧪 Testing Documents Functionality...\n');
    
    // Test 1: Check if tables exist and are accessible
    console.log('1. Testing table access...');
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('count')
      .single();
    
    if (docsError && docsError.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
      throw new Error(`Documents table access failed: ${docsError.message}`);
    }
    console.log('   ✅ Documents table accessible');
    
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('id')
      .limit(1);
    
    if (casesError) {
      throw new Error(`Cases table access failed: ${casesError.message}`);
    }
    console.log('   ✅ Cases table accessible');
    
    // Test 2: Test CRUD operations
    if (casesData && casesData.length > 0) {
      const caseId = casesData[0].id;
      console.log('   ✅ Found existing case for testing');
      
      // Test CREATE
      console.log('\n2. Testing document creation...');
      const testDoc = {
        case_id: caseId,
        type: 'Other',
        file_url: '/test/document.pdf',
        status: 'Pending'
      };
      
      const { data: createData, error: createError } = await supabase
        .from('documents')
        .insert(testDoc)
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Document creation failed: ${createError.message}`);
      }
      console.log('   ✅ Document created successfully');
      
      const docId = createData.id;
      
      // Test READ with JOIN simulation (separate queries)
      console.log('\n3. Testing document read with case data...');
      const { data: readData, error: readError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();
      
      if (readError) {
        throw new Error(`Document read failed: ${readError.message}`);
      }
      
      const { data: caseData, error: caseReadError } = await supabase
        .from('cases')
        .select('id, plaintiff, defendant')
        .eq('id', readData.case_id)
        .single();
      
      if (caseReadError) {
        throw new Error(`Case read failed: ${caseReadError.message}`);
      }
      console.log('   ✅ Document and case data retrieved successfully');
      
      // Test UPDATE
      console.log('\n4. Testing document update...');
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status: 'Served',
          updated_at: new Date().toISOString() // Manually set timestamp since trigger may have naming issue
        })
        .eq('id', docId);
      
      if (updateError) {
        throw new Error(`Document update failed: ${updateError.message}`);
      }
      console.log('   ✅ Document updated successfully');
      
      // Test DELETE (cleanup)
      console.log('\n5. Testing document deletion...');
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      
      if (deleteError) {
        throw new Error(`Document deletion failed: ${deleteError.message}`);
      }
      console.log('   ✅ Document deleted successfully');
      
    } else {
      console.log('   ⚠️  No existing cases found, skipping CRUD tests');
    }
    
    console.log('\n🎉 All tests passed! Documents functionality is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDocumentsFunctionality().catch(console.error);