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

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data identifiers to remove
const TEST_DATA_PATTERNS = {
  cases: [
    // Hardcoded test case ID
    '00000000-0000-0000-0000-000000000001',
    // Common test patterns
    { plaintiff: 'John Doe', defendant: 'ABC Corporation' },
    { plaintiff: 'Sample Plaintiff', defendant: 'Sample Defendant' },
    { plaintiff: 'Test Plaintiff' },
    { defendant: 'Test Defendant' }
  ],
  hearings: [
    // Hardcoded test hearing ID
    '00000000-0000-0000-0000-000000000002',
    // Court name patterns
    { court_name: 'Sample Court' },
    { court_name: 'Test Court' }
  ],
  contacts: [
    // Common test contact patterns
    { email: 'test@example.com' },
    { email: 'sample@example.com' },
    { first_name: 'Test' },
    { first_name: 'Sample' },
    { last_name: 'Test' },
    { last_name: 'Sample' }
  ],
  documents: [
    // Test document patterns
    { filename: 'test' },
    { filename: 'sample' },
    { original_filename: 'test' },
    { original_filename: 'sample' }
  ]
};

async function authenticateAsAdmin() {
  try {
    console.log('Authenticating for cleanup...');
    
    // Try to sign in with test user first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (signInError) {
      console.log('Test user not found or auth failed, continuing without authentication...');
    } else {
      console.log('Authenticated as test user for cleanup');
    }
    
    return true;
  } catch (error) {
    console.log('Authentication not required for cleanup, continuing...');
    return true;
  }
}

async function cleanupCases() {
  try {
    console.log('\n🧹 Cleaning up test cases...');
    
    // Remove cases by hardcoded ID
    const { data: deletedById, error: deleteByIdError } = await supabase
      .from('cases')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select();
    
    if (deleteByIdError) {
      console.error('Error deleting case by ID:', deleteByIdError);
    } else if (deletedById && deletedById.length > 0) {
      console.log(`✅ Deleted ${deletedById.length} case(s) by hardcoded ID`);
    }
    
    // Remove John Doe v ABC Corporation case
    const { data: deletedJohnDoe, error: deleteJohnDoeError } = await supabase
      .from('cases')
      .delete()
      .eq('plaintiff', 'John Doe')
      .eq('defendant', 'ABC Corporation')
      .select();
    
    if (deleteJohnDoeError) {
      console.error('Error deleting John Doe case:', deleteJohnDoeError);
    } else if (deletedJohnDoe && deletedJohnDoe.length > 0) {
      console.log(`✅ Deleted ${deletedJohnDoe.length} "John Doe v ABC Corporation" case(s)`);
    }
    
    // Remove Sample Plaintiff cases
    const { data: deletedSample, error: deleteSampleError } = await supabase
      .from('cases')
      .delete()
      .eq('plaintiff', 'Sample Plaintiff')
      .select();
    
    if (deleteSampleError) {
      console.error('Error deleting sample cases:', deleteSampleError);
    } else if (deletedSample && deletedSample.length > 0) {
      console.log(`✅ Deleted ${deletedSample.length} sample case(s)`);
    }
    
    console.log('✅ Cases cleanup completed');
    
  } catch (error) {
    console.error('Exception during cases cleanup:', error);
  }
}

async function cleanupHearings() {
  try {
    console.log('\n🧹 Cleaning up test hearings...');
    
    // Remove hearings by hardcoded ID
    const { data: deletedById, error: deleteByIdError } = await supabase
      .from('hearings')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000002')
      .select();
    
    if (deleteByIdError) {
      console.error('Error deleting hearing by ID:', deleteByIdError);
    } else if (deletedById && deletedById.length > 0) {
      console.log(`✅ Deleted ${deletedById.length} hearing(s) by hardcoded ID`);
    }
    
    // Remove hearings with test court names
    const { data: deletedSample, error: deleteSampleError } = await supabase
      .from('hearings')
      .delete()
      .in('court_name', ['Sample Court', 'Test Court'])
      .select();
    
    if (deleteSampleError) {
      console.error('Error deleting sample hearings:', deleteSampleError);
    } else if (deletedSample && deletedSample.length > 0) {
      console.log(`✅ Deleted ${deletedSample.length} sample hearing(s)`);
    }
    
    console.log('✅ Hearings cleanup completed');
    
  } catch (error) {
    console.error('Exception during hearings cleanup:', error);
  }
}

async function cleanupContacts() {
  try {
    console.log('\n🧹 Cleaning up test contacts...');
    
    // Remove contacts with test email patterns
    const { data: deletedByEmail, error: deleteByEmailError } = await supabase
      .from('contacts')
      .delete()
      .in('email', ['test@example.com', 'sample@example.com'])
      .select();
    
    if (deleteByEmailError) {
      console.error('Error deleting contacts by email:', deleteByEmailError);
    } else if (deletedByEmail && deletedByEmail.length > 0) {
      console.log(`✅ Deleted ${deletedByEmail.length} contact(s) by test email`);
    }
    
    // Remove contacts with "Test" or "Sample" names
    const { data: deletedByName, error: deleteByNameError } = await supabase
      .from('contacts')
      .delete()
      .or('first_name.eq.Test,first_name.eq.Sample,last_name.eq.Test,last_name.eq.Sample')
      .select();
    
    if (deleteByNameError) {
      console.error('Error deleting contacts by name:', deleteByNameError);
    } else if (deletedByName && deletedByName.length > 0) {
      console.log(`✅ Deleted ${deletedByName.length} contact(s) by test name`);
    }
    
    console.log('✅ Contacts cleanup completed');
    
  } catch (error) {
    console.error('Exception during contacts cleanup:', error);
  }
}

async function cleanupDocuments() {
  try {
    console.log('\n🧹 Cleaning up test documents...');
    
    // Remove documents with test filenames
    const { data: deletedDocs, error: deleteDocsError } = await supabase
      .from('documents')
      .delete()
      .or('filename.ilike.%test%,filename.ilike.%sample%,original_filename.ilike.%test%,original_filename.ilike.%sample%')
      .select();
    
    if (deleteDocsError) {
      console.error('Error deleting test documents:', deleteDocsError);
    } else if (deletedDocs && deletedDocs.length > 0) {
      console.log(`✅ Deleted ${deletedDocs.length} test document(s)`);
    }
    
    console.log('✅ Documents cleanup completed');
    
  } catch (error) {
    console.error('Exception during documents cleanup:', error);
  }
}

async function cleanupTestUser() {
  try {
    console.log('\n🧹 Cleaning up test user account...');
    
    // Note: We can't delete auth users from client-side code
    // This would need to be done through Supabase dashboard or admin API
    console.log('⚠️  Test user (test@example.com) should be removed manually from Supabase Auth dashboard');
    
  } catch (error) {
    console.error('Exception during user cleanup:', error);
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...');
    
    // Check cases
    const { data: remainingCases, error: casesError } = await supabase
      .from('cases')
      .select('id, plaintiff, defendant')
      .or('plaintiff.eq.John Doe,plaintiff.eq.Sample Plaintiff,plaintiff.eq.Test Plaintiff');
    
    if (!casesError) {
      console.log(`📊 Remaining test cases: ${remainingCases?.length || 0}`);
    }
    
    // Check hearings
    const { data: remainingHearings, error: hearingsError } = await supabase
      .from('hearings')
      .select('id, court_name')
      .in('court_name', ['Sample Court', 'Test Court']);
    
    if (!hearingsError) {
      console.log(`📊 Remaining test hearings: ${remainingHearings?.length || 0}`);
    }
    
    // Check contacts
    const { data: remainingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .or('email.eq.test@example.com,email.eq.sample@example.com,first_name.eq.Test,first_name.eq.Sample');
    
    if (!contactsError) {
      console.log(`📊 Remaining test contacts: ${remainingContacts?.length || 0}`);
    }
    
    console.log('✅ Cleanup verification completed');
    
  } catch (error) {
    console.error('Exception during cleanup verification:', error);
  }
}

async function main() {
  console.log('🚀 Starting production test data cleanup...');
  console.log('This will remove all test/sample data from the production database.');
  
  const authenticated = await authenticateAsAdmin();
  
  if (!authenticated) {
    console.error('Failed to authenticate. Exiting.');
    process.exit(1);
  }
  
  // Clean up in reverse dependency order (hearings before cases, etc.)
  await cleanupHearings();
  await cleanupDocuments();
  await cleanupContacts();
  await cleanupCases();
  await cleanupTestUser();
  await verifyCleanup();
  
  console.log('\n🎉 Production test data cleanup completed!');
  console.log('Your production database should now be clean of test data.');
  console.log('\n⚠️  Manual steps still needed:');
  console.log('   1. Remove test@example.com user from Supabase Auth dashboard');
  console.log('   2. Check dashboard to verify all test data is gone');
}

main().catch(console.error);