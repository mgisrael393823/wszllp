import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUIComponents() {
  console.log('🧪 Testing UI Components Integration...\n');
  
  try {
    // Test 1: Check if we have cases with timeline data
    console.log('1️⃣ Checking cases with timeline data...');
    const { data: cases, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .limit(5);
      
    if (caseError) {
      console.error('❌ Error fetching cases:', caseError);
    } else {
      console.log(`✅ Found ${cases.length} cases`);
      
      if (cases.length > 0) {
        const caseId = cases[0].id;
        console.log(`   Testing with case ID: ${caseId}`);
        
        // Check for related data
        const { data: hearings } = await supabase
          .from('hearings')
          .select('*')
          .eq('case_id', caseId);
          
        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId);
          
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('case_id', caseId);
          
        console.log(`   - Hearings: ${hearings?.length || 0}`);
        console.log(`   - Documents: ${documents?.length || 0}`);
        console.log(`   - Invoices: ${invoices?.length || 0}`);
      }
    }
    
    // Test 2: Check component routes
    console.log('\n2️⃣ Component routes to test:');
    console.log('   📍 Dashboard: http://localhost:5178/');
    console.log('   📍 Cases List: http://localhost:5178/cases');
    console.log('   📍 Case Detail (with timeline): http://localhost:5178/cases/[case-id]');
    console.log('   📍 Documents: http://localhost:5178/documents');
    console.log('   📍 Hearings: http://localhost:5178/hearings');
    
    // Test 3: Check for sample documents
    console.log('\n3️⃣ Checking for documents to test viewer...');
    const { data: allDocs, error: docError } = await supabase
      .from('documents')
      .select('*')
      .limit(5);
      
    if (docError) {
      console.error('❌ Error fetching documents:', docError);
    } else {
      console.log(`✅ Found ${allDocs.length} documents`);
      allDocs.forEach(doc => {
        console.log(`   - ${doc.type}: ${doc.file_path || 'No file attached'}`);
      });
    }
    
    // Test 4: Create test document if none exist
    if (!allDocs || allDocs.length === 0) {
      console.log('\n4️⃣ Creating test document...');
      const { data: testDoc, error: createError } = await supabase
        .from('documents')
        .insert({
          case_id: cases[0]?.id,
          type: 'Test Document',
          status: 'Pending',
          notes: 'Test document for UI component testing',
          user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Error creating test document:', createError);
      } else {
        console.log('✅ Created test document:', testDoc.id);
      }
    }
    
    // Test 5: Summary of what to test manually
    console.log('\n5️⃣ Manual Testing Checklist:');
    console.log('\n📋 Timeline Component:');
    console.log('   ☐ Visit a case detail page');
    console.log('   ☐ Check timeline tab is default');
    console.log('   ☐ Test event filtering (All/Hearings/Documents/Invoices/Case)');
    console.log('   ☐ Test sorting (Newest/Oldest first)');
    console.log('   ☐ Expand/collapse event details');
    console.log('   ☐ Click "View Details" to navigate to related tabs');
    console.log('   ☐ Check timeline statistics summary');
    
    console.log('\n📋 Card Components:');
    console.log('   ☐ MetricCards show on dashboard and case detail');
    console.log('   ☐ StatusCard shows case status correctly');
    console.log('   ☐ ActionListCard shows quick actions');
    console.log('   ☐ Cards are clickable where appropriate');
    console.log('   ☐ Hover states work correctly');
    
    console.log('\n📋 Document Viewer:');
    console.log('   ☐ Navigate to document detail page');
    console.log('   ☐ Click "View" button with eye icon');
    console.log('   ☐ Test zoom in/out controls');
    console.log('   ☐ Test rotation control');
    console.log('   ☐ Test fullscreen toggle');
    console.log('   ☐ Test download button');
    console.log('   ☐ Test print button');
    console.log('   ☐ Close modal with X or outside click');
    
    console.log('\n📋 Responsive Design:');
    console.log('   ☐ Test on mobile viewport');
    console.log('   ☐ Test on tablet viewport');
    console.log('   ☐ Test on desktop viewport');
    
    console.log('\n✨ Testing complete! Check the browser for visual testing.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testUIComponents();