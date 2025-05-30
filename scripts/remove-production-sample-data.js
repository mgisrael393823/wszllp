import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for deletions

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

console.log('🚀 Removing sample data from production database...');
console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeSampleData() {
  try {
    // Remove sample cases created by create-sample-data.js
    const samplePlaintiffs = [
      'John Doe',
      'Jane Smith', 
      'Wilson Property Management',
      'Metro Apartments',
      'Downtown Realty'
    ];
    
    const sampleDefendants = [
      'ABC Corporation',
      'XYZ Properties LLC',
      'Robert Johnson',
      'Sarah Williams',
      'Michael Brown'
    ];

    console.log('🗑️  Removing sample hearings...');
    // First remove hearings with sample court names
    const { error: hearingError } = await supabase
      .from('hearings')
      .delete()
      .eq('court_name', 'San Francisco Superior Court');
      
    if (hearingError) {
      console.error('Error removing sample hearings:', hearingError);
    } else {
      console.log('✅ Sample hearings removed');
    }

    console.log('🗑️  Removing sample cases...');
    // Remove cases with sample plaintiff names
    for (const plaintiff of samplePlaintiffs) {
      const { error: caseError } = await supabase
        .from('cases')
        .delete()
        .eq('plaintiff', plaintiff);
        
      if (caseError) {
        console.error(`Error removing case for ${plaintiff}:`, caseError);
      } else {
        console.log(`✅ Removed cases for plaintiff: ${plaintiff}`);
      }
    }

    // Also remove by defendant names in case there are variations
    for (const defendant of sampleDefendants) {
      const { error: caseError } = await supabase
        .from('cases')
        .delete()
        .eq('defendant', defendant);
        
      if (caseError) {
        console.error(`Error removing case for ${defendant}:`, caseError);
      } else {
        console.log(`✅ Removed cases for defendant: ${defendant}`);
      }
    }

    console.log('🔍 Verifying cleanup...');
    // Verify removal
    const { data: remainingCases, error: verifyError } = await supabase
      .from('cases')
      .select('*')
      .in('plaintiff', samplePlaintiffs);
      
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError);
    } else {
      console.log(`📊 Remaining sample cases: ${remainingCases?.length || 0}`);
    }

    const { data: remainingHearings, error: hearingVerifyError } = await supabase
      .from('hearings')
      .select('*')
      .eq('court_name', 'San Francisco Superior Court');
      
    if (hearingVerifyError) {
      console.error('Error verifying hearing cleanup:', hearingVerifyError);
    } else {
      console.log(`📊 Remaining sample hearings: ${remainingHearings?.length || 0}`);
    }

    console.log('🎉 Production sample data removal completed!');
    
  } catch (error) {
    console.error('Exception when removing sample data:', error);
  }
}

removeSampleData().catch(console.error);