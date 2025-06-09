#!/usr/bin/env node

/**
 * Verify JavaScript Client Authentication
 * This script tests if the Supabase JS client is properly authenticating
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function testAuthentication() {
  console.log('🔍 Testing Supabase Client Authentication\n');
  
  // Create service role client to set up test users
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Create test user
  const testEmail = `auth-test-${Date.now()}@test.local`;
  const testPassword = 'testpass123!';
  
  console.log('1. Creating test user...');
  const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });
  
  if (createError) {
    console.error('❌ Failed to create user:', createError);
    return;
  }
  
  const userId = userData.user.id;
  console.log(`✅ Created user: ${userId}`);
  
  // Create anon client and sign in
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('\n2. Signing in with anon client...');
  const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (signInError) {
    console.error('❌ Sign in failed:', signInError);
    await serviceClient.auth.admin.deleteUser(userId);
    return;
  }
  
  console.log('✅ Signed in successfully');
  console.log(`   Session user: ${authData.user.id}`);
  console.log(`   Access token: ${authData.session.access_token.substring(0, 20)}...`);
  
  // Verify the session
  console.log('\n3. Verifying session...');
  const { data: { user }, error: sessionError } = await anonClient.auth.getUser();
  
  if (sessionError) {
    console.error('❌ Session verification failed:', sessionError);
  } else {
    console.log('✅ Session valid');
    console.log(`   Current user: ${user.id}`);
    console.log(`   Email: ${user.email}`);
  }
  
  // Test database access with auth
  console.log('\n4. Testing authenticated database access...');
  
  // Insert a test case
  const { data: testCase, error: insertError } = await anonClient
    .from('cases')
    .insert({
      plaintiff: 'Auth Test Plaintiff',
      defendant: 'Auth Test Defendant',
      address: '123 Auth Test St',
      status: 'Test'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError);
  } else {
    console.log('✅ Insert successful');
    console.log(`   Case ID: ${testCase.id}`);
    console.log(`   User ID on case: ${testCase.user_id}`);
    console.log(`   Matches auth user: ${testCase.user_id === userId}`);
    
    // Try to read it back
    const { data: readCase, error: readError } = await anonClient
      .from('cases')
      .select('*')
      .eq('id', testCase.id)
      .single();
    
    if (readError) {
      console.error('❌ Read back failed:', readError);
    } else {
      console.log('✅ Read back successful');
    }
    
    // Clean up
    await anonClient.from('cases').delete().eq('id', testCase.id);
  }
  
  // Test with a second user
  console.log('\n5. Testing cross-user isolation...');
  
  const user2Email = `auth-test-2-${Date.now()}@test.local`;
  const { data: user2Data, error: user2CreateError } = await serviceClient.auth.admin.createUser({
    email: user2Email,
    password: testPassword,
    email_confirm: true
  });
  
  if (user2CreateError) {
    console.error('❌ Failed to create user 2:', user2CreateError);
  } else {
    const user2Id = user2Data.user.id;
    console.log(`✅ Created user 2: ${user2Id}`);
    
    // Create new client for user 2
    const user2Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Sign in as user 2
    const { error: user2SignInError } = await user2Client.auth.signInWithPassword({
      email: user2Email,
      password: testPassword
    });
    
    if (!user2SignInError && testCase) {
      // Try to access user 1's case
      const { data: crossUserCase, error: crossUserError } = await user2Client
        .from('cases')
        .select('*')
        .eq('id', testCase.id)
        .single();
      
      if (crossUserError || !crossUserCase) {
        console.log('✅ Cross-user isolation working: User 2 cannot see User 1 case');
      } else {
        console.error('❌ SECURITY ISSUE: User 2 can see User 1 case!');
      }
      
      // Try to update user 1's case
      const { error: updateError } = await user2Client
        .from('cases')
        .update({ status: 'Hacked' })
        .eq('id', testCase.id);
      
      if (updateError) {
        console.log('✅ Update blocked: User 2 cannot update User 1 case');
      } else {
        console.error('❌ SECURITY ISSUE: User 2 can update User 1 case!');
      }
    }
    
    // Clean up user 2
    await serviceClient.auth.admin.deleteUser(user2Id);
  }
  
  // Clean up
  console.log('\n6. Cleaning up...');
  await serviceClient.auth.admin.deleteUser(userId);
  console.log('✅ Cleanup complete');
  
  console.log('\n=== Authentication Test Complete ===');
}

testAuthentication().catch(console.error);