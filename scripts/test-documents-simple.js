import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleTest() {
  try {
    console.log('🧪 Simple Documents Test...\n');
    
    // Test basic read operation (what the UI does)
    console.log('1. Testing documents query (as useDocuments does)...');
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(5);
    
    if (docsError) {
      throw new Error(`Documents query failed: ${docsError.message}`);
    }
    console.log(`   ✅ Documents query successful (${docsData.length} records)`);
    
    // Test cases query
    console.log('2. Testing cases query...');
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('id, plaintiff, defendant')
      .limit(5);
    
    if (casesError) {
      throw new Error(`Cases query failed: ${casesError.message}`);
    }
    console.log(`   ✅ Cases query successful (${casesData.length} records)`);
    
    // Test document counts (as DocumentManagement does)
    console.log('3. Testing document counts by type...');
    const types = ['Complaint', 'Summons', 'Motion', 'Order', 'Affidavit', 'Other'];
    for (const type of types) {
      const { count, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('type', type);
      
      if (error) {
        throw new Error(`Count query for ${type} failed: ${error.message}`);
      }
      console.log(`   ✅ ${type}: ${count || 0} documents`);
    }
    
    console.log('\n🎉 All core functionality tests passed!');
    console.log('📄 Documents page should work correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

simpleTest().catch(console.error);