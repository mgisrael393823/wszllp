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
console.log('Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // Test the connection by retrieving the current user info (doesn't require any functions)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Connection status: OK');
    
    // Create a test user if needed for RLS policies
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    console.log('Creating a test user for authentication...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      
      // Try signing in if the user already exists
      console.log('Trying to sign in with test user...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('Error signing in with test user:', signInError);
        return false;
      }
      
      console.log('Successfully signed in with test user');
    } else {
      console.log('Successfully created test user');
    }
    
    return true;
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return false;
  }
}

async function checkCasesTable() {
  try {
    console.log('Checking cases table...');
    
    // Try to query the cases table
    const { data, error } = await supabase
      .from('cases')
      .select('id, plaintiff, defendant')
      .limit(5);
      
    if (error) {
      console.error('Error accessing cases table:', error);
      console.log('The cases table may not exist or you may not have permission to access it.');
      console.log('Please follow the setup instructions in docs/SUPABASE-SETUP.md');
      return false;
    }
    
    console.log('Successfully accessed cases table!');
    console.log(`Found ${data.length} records in the cases table.`);
    
    if (data.length === 0) {
      console.log('Creating a sample case for testing...');
      
      // Create a sample case if none exists
      const { data: newCase, error: insertError } = await supabase
        .from('cases')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          plaintiff: 'Sample Plaintiff',
          defendant: 'Sample Defendant',
          address: '123 Test Street',
          status: 'Intake',
        })
        .select();
        
      if (insertError) {
        console.error('Error creating sample case:', insertError);
        return false;
      }
      
      console.log('Created sample case:', newCase);
    } else {
      console.log('Sample cases:', data);
    }
    
    return true;
  } catch (error) {
    console.error('Exception when checking cases table:', error);
    return false;
  }
}

async function checkHearingsTable() {
  try {
    console.log('Checking hearings table...');
    
    // Try to query the hearings table
    const { data, error } = await supabase
      .from('hearings')
      .select('id, case_id, court_name, hearing_date')
      .limit(5);
      
    if (error) {
      console.error('Error accessing hearings table:', error);
      console.log('The hearings table may not exist or you may not have permission to access it.');
      console.log('Please follow the setup instructions in docs/SUPABASE-SETUP.md');
      return false;
    }
    
    console.log('Successfully accessed hearings table!');
    console.log(`Found ${data.length} records in the hearings table.`);
    
    // Get a case to use for testing
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .limit(1);
      
    if (caseError || caseData.length === 0) {
      console.error('Error getting a case for testing hearings:', caseError);
      return false;
    }
    
    if (data.length === 0) {
      console.log('Creating a sample hearing for testing...');
      
      // Create a sample hearing if none exists
      const { data: newHearing, error: insertError } = await supabase
        .from('hearings')
        .insert({
          id: '00000000-0000-0000-0000-000000000002',
          case_id: caseData[0].id,
          court_name: 'Sample Court',
          hearing_date: new Date().toISOString(),
          participants: ['Judge Test', 'Attorney Example'],
          outcome: 'Sample hearing for testing',
        })
        .select();
        
      if (insertError) {
        console.error('Error creating sample hearing:', insertError);
        return false;
      }
      
      console.log('Created sample hearing:', newHearing);
    } else {
      console.log('Sample hearings:', data);
    }
    
    return true;
  } catch (error) {
    console.error('Exception when checking hearings table:', error);
    return false;
  }
}

async function main() {
  const connectionSuccess = await testSupabaseConnection();
  
  if (connectionSuccess) {
    // First check if the cases table exists
    const casesSuccess = await checkCasesTable();
    
    // Only check hearings if cases table exists
    if (casesSuccess) {
      await checkHearingsTable();
    }
  }
}

main().catch(console.error);