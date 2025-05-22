const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // Test the connection by getting the server time
    const { data, error } = await supabase.rpc('get_current_timestamp');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Server time:', data);
    return true;
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return false;
  }
}

async function checkHearingsTable() {
  try {
    console.log('Checking hearings table...');
    
    // Try to query the hearings table
    const { data, error } = await supabase
      .from('hearings')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error accessing hearings table:', error);
      console.log('The hearings table may not exist or you may not have permission to access it.');
      console.log('Please follow the setup instructions in docs/SUPABASE-SETUP.md');
      return false;
    }
    
    console.log('Successfully accessed hearings table!');
    console.log(`Found ${data.length} records in the hearings table.`);
    return true;
  } catch (error) {
    console.error('Exception when checking hearings table:', error);
    return false;
  }
}

async function main() {
  const connectionSuccess = await testSupabaseConnection();
  
  if (connectionSuccess) {
    await checkHearingsTable();
  }
}

main().catch(console.error);