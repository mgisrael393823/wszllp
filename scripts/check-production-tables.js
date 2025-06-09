import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://karvbtpygbavvqydfcju.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('🔍 Checking production database tables...\n');

  try {
    // Query to get all tables in public schema
    const { data: tables, error } = await supabase
      .rpc('get_tables_info', {}, { 
        get: true,
        head: false 
      })
      .single();

    if (error) {
      // Fallback: Try a direct query approach
      console.log('Using fallback method to check tables...');
      
      // Check each table individually
      const tablesToCheck = [
        'cases',
        'documents', 
        'contacts',
        'case_parties',
        'hearings',
        'case_contacts',
        'contact_communications'
      ];

      console.log('Table Existence Check:');
      console.log('=====================');
      
      for (const table of tablesToCheck) {
        try {
          const { data, error: tableError } = await supabase
            .from(table)
            .select('id')
            .limit(0);
          
          if (tableError) {
            console.log(`❌ ${table}: NOT FOUND`);
          } else {
            console.log(`✅ ${table}: EXISTS`);
            
            // Check for user_id column
            const { data: sample, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (!sampleError && sample && sample.length > 0) {
              const hasUserId = 'user_id' in sample[0];
              console.log(`   └─ user_id column: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
            }
          }
        } catch (e) {
          console.log(`❌ ${table}: ERROR - ${e.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Run the check
checkTables();