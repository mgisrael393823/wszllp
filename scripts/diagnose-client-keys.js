#!/usr/bin/env node

/**
 * Diagnose Client Keys
 * This script checks which Supabase keys are being used and their permissions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Diagnosing Supabase Client Keys\n');

console.log('Environment:');
console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
console.log('');

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Decode JWT to check roles (basic base64 decode)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

console.log('Analyzing keys:\n');

// Check anon key
const anonPayload = decodeJWT(SUPABASE_ANON_KEY);
if (anonPayload) {
  console.log('ANON KEY:');
  console.log(`  Role: ${anonPayload.role}`);
  console.log(`  Issuer: ${anonPayload.iss}`);
  console.log(`  This key should have role: "anon"`);
  console.log('');
}

// Check service role key
const servicePayload = decodeJWT(SUPABASE_SERVICE_ROLE_KEY);
if (servicePayload) {
  console.log('SERVICE ROLE KEY:');
  console.log(`  Role: ${servicePayload.role}`);
  console.log(`  Issuer: ${servicePayload.iss}`);
  console.log(`  This key should have role: "service_role"`);
  console.log(`  ⚠️  WARNING: Service role bypasses ALL RLS policies!`);
  console.log('');
}

// Test RLS bypass with different clients
async function testRLSBypass() {
  console.log('Testing RLS behavior with different clients:\n');
  
  // Create both clients
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Create a test user and case with service client
  const testEmail = `key-test-${Date.now()}@test.local`;
  const { data: userData, error: userError } = await serviceClient.auth.admin.createUser({
    email: testEmail,
    password: 'test123!',
    email_confirm: true
  });
  
  if (userError) {
    console.error('Failed to create test user:', userError);
    return;
  }
  
  const userId = userData.user.id;
  
  // Insert a case directly with service role (bypasses RLS)
  const { data: testCase, error: insertError } = await serviceClient
    .from('cases')
    .insert({
      user_id: userId,
      plaintiff: 'Key Test',
      defendant: 'Test',
      address: 'Test',
      status: 'Test'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Failed to create test case:', insertError);
    await serviceClient.auth.admin.deleteUser(userId);
    return;
  }
  
  console.log(`✅ Created test case ${testCase.id} for user ${userId}`);
  
  // Test 1: Service role can see everything (bypasses RLS)
  console.log('\n1. Service role client (bypasses RLS):');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('cases')
    .select('id, user_id')
    .eq('id', testCase.id)
    .single();
  
  if (serviceData) {
    console.log('   ✅ Can read any case (RLS bypassed)');
  } else {
    console.log('   ❌ Cannot read case (unexpected!)');
  }
  
  // Test 2: Anon client without auth should see nothing
  console.log('\n2. Anon client without authentication:');
  const { data: anonData, error: anonError } = await anonClient
    .from('cases')
    .select('id, user_id')
    .eq('id', testCase.id)
    .single();
  
  if (anonError || !anonData) {
    console.log('   ✅ Cannot read case (RLS working)');
  } else {
    console.log('   ❌ CAN read case without auth! (RLS not working!)');
  }
  
  // Test 3: Wrong service role usage in tests?
  console.log('\n3. Checking for accidental service role usage:');
  console.log('   If your JavaScript tests use SERVICE_ROLE_KEY for authenticated');
  console.log('   user operations, RLS will be completely bypassed!');
  console.log('   ');
  console.log('   Correct pattern:');
  console.log('   - Use SERVICE_ROLE_KEY only for admin operations (create users)');
  console.log('   - Use ANON_KEY + auth.signIn() for user operations');
  
  // Cleanup
  await serviceClient.from('cases').delete().eq('id', testCase.id);
  await serviceClient.auth.admin.deleteUser(userId);
  
  console.log('\n✅ Diagnostic complete');
}

testRLSBypass().catch(console.error);