import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://karvbtpygbavvqydfcju.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugRLS() {
  console.log('🔍 Debugging RLS Issues\n');

  // Create clients
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get two existing cases with different owners
    const { data: cases, error: casesError } = await serviceClient
      .from('cases')
      .select('id, user_id, plaintiff')
      .limit(10);

    if (casesError || !cases || cases.length < 2) {
      console.log('Need at least 2 cases to test');
      return;
    }

    // Group by user_id
    const casesByUser = {};
    cases.forEach(c => {
      if (!casesByUser[c.user_id]) casesByUser[c.user_id] = [];
      casesByUser[c.user_id].push(c);
    });

    const userIds = Object.keys(casesByUser);
    if (userIds.length < 2) {
      console.log('All cases belong to same user, cannot test cross-user access');
      return;
    }

    const user1Id = userIds[0];
    const user2Id = userIds[1];
    const user1Case = casesByUser[user1Id][0];
    const user2Case = casesByUser[user2Id][0];

    console.log(`User 1: ${user1Id} owns case ${user1Case.id}`);
    console.log(`User 2: ${user2Id} owns case ${user2Case.id}\n`);

    // Get user emails for login
    const { data: user1Data } = await serviceClient.auth.admin.getUserById(user1Id);
    const { data: user2Data } = await serviceClient.auth.admin.getUserById(user2Id);

    if (!user1Data?.user?.email || !user2Data?.user?.email) {
      console.log('Cannot get user emails for testing');
      return;
    }

    console.log(`User 1 email: ${user1Data.user.email}`);
    console.log(`User 2 email: ${user2Data.user.email}\n`);

    // Create a new anon client and sign in as user2
    const testClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to sign in (this might fail if we don't know passwords)
    console.log('Testing without authentication first...\n');

    // Test 1: Can unauthenticated user see cases?
    const { data: unauthCases, error: unauthError } = await testClient
      .from('cases')
      .select('id')
      .eq('id', user1Case.id);

    console.log('Unauthenticated SELECT test:');
    console.log(`  Result: ${unauthError ? '✅ Blocked' : '❌ ALLOWED'}`);
    if (unauthError) console.log(`  Error: ${unauthError.message}`);
    if (unauthCases) console.log(`  Data: ${JSON.stringify(unauthCases)}`);

    // Test 2: Can unauthenticated user update?
    const { error: unauthUpdateError } = await testClient
      .from('cases')
      .update({ status: 'Hacked' })
      .eq('id', user1Case.id);

    console.log('\nUnauthenticated UPDATE test:');
    console.log(`  Result: ${unauthUpdateError ? '✅ Blocked' : '❌ ALLOWED'}`);
    if (unauthUpdateError) console.log(`  Error: ${unauthUpdateError.message}`);

    // Test 3: Direct SQL query to check RLS
    console.log('\n🔍 Direct SQL RLS Check:');
    
    const { data: rlsCheck, error: rlsError } = await serviceClient.rpc('validate_backfill_status');
    if (!rlsError && rlsCheck) {
      console.log('\nUser ID coverage:');
      rlsCheck.forEach(table => {
        console.log(`  ${table.table_name}: ${table.records_without_user_id} records without user_id`);
      });
    }

    // Test 4: Check auth configuration
    const { data: { user: currentUser } } = await testClient.auth.getUser();
    console.log(`\nCurrent auth state: ${currentUser ? 'Authenticated as ' + currentUser.id : 'Not authenticated'}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run with environment variables
if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:');
  console.error('export SUPABASE_ANON_KEY="..."');
  console.error('export SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

debugRLS();