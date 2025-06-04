import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking table schema...');
    
    // Test query to see what columns are available
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .limit(1);
      
    if (casesError) {
      console.error('Error querying cases table:', casesError);
    } else {
      console.log('Cases table columns:', casesData.length > 0 ? Object.keys(casesData[0]) : 'No data');
      
      // Create a test row with only required fields
      console.log('Trying to insert minimal case...');
      const { data: testCase, error: insertError } = await supabase
        .from('cases')
        .insert({
          id: '11111111-1111-1111-1111-111111111111',
          plaintiff: 'Test Plaintiff',
          defendant: 'Test Defendant',
          status: 'Test'
        })
        .select();
        
      if (insertError) {
        console.error('Error inserting test case:', insertError);
      } else {
        console.log('Test case inserted:', testCase);
        
        // Clean up test data
        await supabase
          .from('cases')
          .delete()
          .eq('id', '11111111-1111-1111-1111-111111111111');
      }
    }
    
    const { data: hearingsData, error: hearingsError } = await supabase
      .from('hearings')
      .select('*')
      .limit(1);
      
    if (hearingsError) {
      console.error('Error querying hearings table:', hearingsError);
    } else {
      console.log('Hearings table columns:', hearingsData.length > 0 ? Object.keys(hearingsData[0]) : 'No data');
    }
    
  } catch (error) {
    console.error('Exception when checking schema:', error);
  }
}

checkSchema().catch(console.error);