#!/usr/bin/env node

/**
 * RLS Policy Testing Script
 * 
 * This script validates that Row Level Security policies are working correctly
 * by testing cross-user data isolation and proper ownership enforcement.
 * 
 * Usage: node scripts/test-rls-policies.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_ANON_KEY');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create clients
const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test state
let testResults = [];
let testUser1 = null;
let testUser2 = null;
let user1Client = null;
let user2Client = null;

/**
 * Log test result
 */
function logTest(testName, passed, details = '') {
  const result = { testName, passed, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${testName}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('\n🔧 Setting up test users...');
  
  try {
    // Create test user 1
    const user1Email = `test-user-1-${crypto.randomUUID()}@test.local`;
    const user1Password = 'testpass123!';
    
    const { data: user1Data, error: user1Error } = await serviceRoleClient.auth.admin.createUser({
      email: user1Email,
      password: user1Password,
      email_confirm: true
    });
    
    if (user1Error) throw new Error(`Failed to create user 1: ${user1Error.message}`);
    testUser1 = user1Data.user;
    
    // Create test user 2
    const user2Email = `test-user-2-${crypto.randomUUID()}@test.local`;
    const user2Password = 'testpass123!';
    
    const { data: user2Data, error: user2Error } = await serviceRoleClient.auth.admin.createUser({
      email: user2Email,
      password: user2Password,
      email_confirm: true
    });
    
    if (user2Error) throw new Error(`Failed to create user 2: ${user2Error.message}`);
    testUser2 = user2Data.user;
    
    // Create authenticated clients for each user
    user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    user2Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Sign in users
    const { error: signIn1Error } = await user1Client.auth.signInWithPassword({
      email: user1Email,
      password: user1Password
    });
    if (signIn1Error) throw new Error(`Failed to sign in user 1: ${signIn1Error.message}`);
    
    const { error: signIn2Error } = await user2Client.auth.signInWithPassword({
      email: user2Email,
      password: user2Password
    });
    if (signIn2Error) throw new Error(`Failed to sign in user 2: ${signIn2Error.message}`);
    
    console.log(`✅ Created test users: ${testUser1.id} and ${testUser2.id}`);
    
  } catch (error) {
    console.error('❌ Failed to create test users:', error.message);
    process.exit(1);
  }
}

/**
 * Test case RLS policies
 */
async function testCaseRLS() {
  console.log('\n🧪 Testing Case RLS policies...');
  
  try {
    // User 1 creates a case
    const { data: case1, error: createError } = await user1Client
      .from('cases')
      .insert({
        plaintiff: 'Test Plaintiff 1',
        defendant: 'Test Defendant 1',
        address: '123 Test St',
        status: 'Open'
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Case Creation', false, `User 1 failed to create case: ${createError.message}`);
      return;
    }
    
    logTest('Case Creation', true, `User 1 created case ${case1.id}`);
    
    // User 1 should be able to read their own case
    const { data: ownCase, error: ownReadError } = await user1Client
      .from('cases')
      .select()
      .eq('id', case1.id)
      .single();
    
    logTest('Case Owner Read Access', !ownReadError && ownCase?.id === case1.id, 
      ownReadError ? ownReadError.message : 'User 1 can read their own case');
    
    // User 2 should NOT be able to read User 1's case
    const { data: otherCase, error: otherReadError } = await user2Client
      .from('cases')
      .select()
      .eq('id', case1.id)
      .single();
    
    logTest('Case Cross-User Isolation', otherReadError || !otherCase, 
      otherCase ? 'SECURITY VIOLATION: User 2 can read User 1\'s case!' : 'User 2 correctly blocked from reading User 1\'s case');
    
    // User 2 should NOT be able to update User 1's case
    const { error: updateError } = await user2Client
      .from('cases')
      .update({ status: 'Closed' })
      .eq('id', case1.id);
    
    logTest('Case Cross-User Update Block', !!updateError, 
      updateError ? 'User 2 correctly blocked from updating User 1\'s case' : 'SECURITY VIOLATION: User 2 can update User 1\'s case!');
    
    // User 2 should NOT be able to delete User 1's case
    const { error: deleteError } = await user2Client
      .from('cases')
      .delete()
      .eq('id', case1.id);
    
    logTest('Case Cross-User Delete Block', !!deleteError, 
      deleteError ? 'User 2 correctly blocked from deleting User 1\'s case' : 'SECURITY VIOLATION: User 2 can delete User 1\'s case!');
    
  } catch (error) {
    logTest('Case RLS Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Test document RLS policies
 */
async function testDocumentRLS() {
  console.log('\n📄 Testing Document RLS policies...');
  
  try {
    // First, create a case for User 1
    const { data: case1, error: caseError } = await user1Client
      .from('cases')
      .insert({
        plaintiff: 'Doc Test Plaintiff',
        defendant: 'Doc Test Defendant',
        address: '456 Doc St',
        status: 'Open'
      })
      .select()
      .single();
    
    if (caseError) {
      logTest('Document Test Setup', false, `Failed to create test case: ${caseError.message}`);
      return;
    }
    
    // User 1 creates a document linked to their case
    const { data: doc1, error: createError } = await user1Client
      .from('documents')
      .insert({
        case_id: case1.id,
        type: 'Complaint',
        file_url: 'https://example.com/test.pdf',
        status: 'Pending',
        original_filename: 'test.pdf'
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Document Creation', false, `User 1 failed to create document: ${createError.message}`);
      return;
    }
    
    logTest('Document Creation', true, `User 1 created document ${doc1.id}`);
    
    // User 1 should be able to read their own document
    const { data: ownDoc, error: ownReadError } = await user1Client
      .from('documents')
      .select()
      .eq('id', doc1.id)
      .single();
    
    logTest('Document Owner Read Access', !ownReadError && ownDoc?.id === doc1.id, 
      ownReadError ? ownReadError.message : 'User 1 can read their own document');
    
    // User 2 should NOT be able to read User 1's document
    const { data: otherDoc, error: otherReadError } = await user2Client
      .from('documents')
      .select()
      .eq('id', doc1.id)
      .single();
    
    logTest('Document Cross-User Isolation', otherReadError || !otherDoc, 
      otherDoc ? 'SECURITY VIOLATION: User 2 can read User 1\'s document!' : 'User 2 correctly blocked from reading User 1\'s document');
    
    // User 2 should NOT be able to create document for User 1's case
    const { error: createOtherError } = await user2Client
      .from('documents')
      .insert({
        case_id: case1.id,
        type: 'Motion',
        file_url: 'https://example.com/hack.pdf',
        status: 'Pending',
        original_filename: 'hack.pdf'
      });
    
    logTest('Document Cross-Case Creation Block', !!createOtherError, 
      createOtherError ? 'User 2 correctly blocked from creating document for User 1\'s case' : 'SECURITY VIOLATION: User 2 can create documents for User 1\'s case!');
    
  } catch (error) {
    logTest('Document RLS Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Test case_parties RLS policies (CRITICAL SECURITY)
 */
async function testCasePartiesRLS() {
  console.log('\n👥 Testing Case Parties RLS policies (CRITICAL)...');
  
  try {
    // Create a case for User 1
    const { data: case1, error: caseError } = await user1Client
      .from('cases')
      .insert({
        plaintiff: 'Parties Test Plaintiff',
        defendant: 'Parties Test Defendant',
        address: '789 Parties St',
        status: 'Open'
      })
      .select()
      .single();
    
    if (caseError) {
      logTest('Case Parties Test Setup', false, `Failed to create test case: ${caseError.message}`);
      return;
    }
    
    // User 1 creates case parties
    const { data: party1, error: createError } = await user1Client
      .from('case_parties')
      .insert({
        case_id: case1.id,
        name: 'John Doe',
        role: 'Plaintiff',
        contact_info: 'john@example.com'
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Case Parties Creation', false, `User 1 failed to create case party: ${createError.message}`);
      return;
    }
    
    logTest('Case Parties Creation', true, `User 1 created case party ${party1.id}`);
    
    // User 1 should be able to read their own case parties
    const { data: ownParties, error: ownReadError } = await user1Client
      .from('case_parties')
      .select()
      .eq('case_id', case1.id);
    
    logTest('Case Parties Owner Read Access', !ownReadError && ownParties?.length > 0, 
      ownReadError ? ownReadError.message : 'User 1 can read their own case parties');
    
    // CRITICAL: User 2 should NOT be able to read User 1's case parties
    const { data: otherParties, error: otherReadError } = await user2Client
      .from('case_parties')
      .select()
      .eq('case_id', case1.id);
    
    logTest('Case Parties Cross-User Isolation (CRITICAL)', otherReadError || !otherParties || otherParties.length === 0, 
      (otherParties && otherParties.length > 0) ? '🚨 CRITICAL SECURITY VIOLATION: User 2 can read User 1\'s case parties!' : 'User 2 correctly blocked from reading User 1\'s case parties');
    
    // CRITICAL: User 2 should NOT be able to read specific case party
    const { data: specificParty, error: specificReadError } = await user2Client
      .from('case_parties')
      .select()
      .eq('id', party1.id)
      .single();
    
    logTest('Case Parties Specific Record Isolation (CRITICAL)', specificReadError || !specificParty, 
      specificParty ? '🚨 CRITICAL SECURITY VIOLATION: User 2 can read specific case party by ID!' : 'User 2 correctly blocked from reading specific case party');
    
    // User 2 should NOT be able to create parties for User 1's case
    const { error: createOtherError } = await user2Client
      .from('case_parties')
      .insert({
        case_id: case1.id,
        name: 'Jane Hacker',
        role: 'Unauthorized',
        contact_info: 'hacker@evil.com'
      });
    
    logTest('Case Parties Cross-Case Creation Block', !!createOtherError, 
      createOtherError ? 'User 2 correctly blocked from creating parties for User 1\'s case' : 'SECURITY VIOLATION: User 2 can create parties for User 1\'s case!');
    
  } catch (error) {
    logTest('Case Parties RLS Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Test contact RLS policies
 */
async function testContactRLS() {
  console.log('\n📞 Testing Contact RLS policies...');
  
  try {
    // User 1 creates a contact with unique email
    const uniqueEmail = `contact-${crypto.randomUUID()}@test.com`;
    const { data: contact1, error: createError } = await user1Client
      .from('contacts')
      .insert({
        name: 'Test Contact 1',
        email: uniqueEmail,
        phone: '555-0001',
        contact_type: 'Client'
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Contact Creation', false, `User 1 failed to create contact: ${createError.message}`);
      return;
    }
    
    logTest('Contact Creation', true, `User 1 created contact ${contact1.id}`);
    
    // User 1 should be able to read their own contact
    const { data: ownContact, error: ownReadError } = await user1Client
      .from('contacts')
      .select()
      .eq('id', contact1.id)
      .single();
    
    logTest('Contact Owner Read Access', !ownReadError && ownContact?.id === contact1.id, 
      ownReadError ? ownReadError.message : 'User 1 can read their own contact');
    
    // User 2 should NOT be able to read User 1's contact
    const { data: otherContact, error: otherReadError } = await user2Client
      .from('contacts')
      .select()
      .eq('id', contact1.id)
      .single();
    
    logTest('Contact Cross-User Isolation', otherReadError || !otherContact, 
      otherContact ? 'SECURITY VIOLATION: User 2 can read User 1\'s contact!' : 'User 2 correctly blocked from reading User 1\'s contact');
    
  } catch (error) {
    logTest('Contact RLS Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Test RPC function security
 */
async function testRPCFunctionSecurity() {
  console.log('\n⚙️ Testing RPC Function Security...');
  
  try {
    // Test create_case_with_transaction function
    const { data: rpcCase, error: rpcError } = await user1Client
      .rpc('create_case_with_transaction', {
        p_plaintiff: 'RPC Test Plaintiff',
        p_defendant: 'RPC Test Defendant',
        p_address: 'RPC Test Address',
        p_status: 'Open'
      });
    
    if (rpcError) {
      logTest('RPC Case Creation', false, `Failed to create case via RPC: ${rpcError.message}`);
    } else {
      logTest('RPC Case Creation', true, `Successfully created case via RPC: ${rpcCase}`);
      
      // Verify the case was created with correct user_id
      const { data: createdCase, error: verifyError } = await user1Client
        .from('cases')
        .select()
        .eq('id', rpcCase)
        .single();
      
      logTest('RPC Case User Assignment', !verifyError && createdCase?.user_id === testUser1.id, 
        verifyError ? verifyError.message : 'RPC case correctly assigned to calling user');
      
      // Verify User 2 cannot see the RPC-created case
      const { data: invisibleCase, error: invisibleError } = await user2Client
        .from('cases')
        .select()
        .eq('id', rpcCase)
        .single();
      
      logTest('RPC Case Cross-User Isolation', invisibleError || !invisibleCase, 
        invisibleCase ? 'SECURITY VIOLATION: User 2 can see RPC case created by User 1!' : 'RPC case correctly isolated from other users');
    }
    
  } catch (error) {
    logTest('RPC Function Security Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Test audit logging
 */
async function testAuditLogging() {
  console.log('\n📊 Testing Security Audit Logging...');
  
  try {
    // Check if security audit functions are available
    const { data: metrics, error: metricsError } = await user1Client
      .rpc('get_security_metrics', { lookback_hours: 1 });
    
    logTest('Security Metrics Function', !metricsError, 
      metricsError ? metricsError.message : 'Security metrics function accessible');
    
    const { data: violations, error: violationsError } = await user1Client
      .rpc('check_rls_violations', { time_window: '1 hour' });
    
    logTest('RLS Violations Check Function', !violationsError, 
      violationsError ? violationsError.message : 'RLS violations check function accessible');
    
    // Check if RLS policy coverage function works
    const { data: coverage, error: coverageError } = await user1Client
      .rpc('check_rls_policy_coverage');
    
    logTest('RLS Policy Coverage Check', !coverageError && coverage?.length > 0, 
      coverageError ? coverageError.message : `Found RLS policies for ${coverage?.length || 0} tables`);
    
  } catch (error) {
    logTest('Audit Logging Test Suite', false, `Unexpected error: ${error.message}`);
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    if (testUser1) {
      await serviceRoleClient.auth.admin.deleteUser(testUser1.id);
      console.log(`✅ Deleted test user 1: ${testUser1.id}`);
    }
    
    if (testUser2) {
      await serviceRoleClient.auth.admin.deleteUser(testUser2.id);
      console.log(`✅ Deleted test user 2: ${testUser2.id}`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

/**
 * Generate test report
 */
function generateReport() {
  console.log('\n📋 Test Report');
  console.log('=====================================');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   • ${r.testName}: ${r.details}`);
      });
  }
  
  // Check for critical security violations
  const securityViolations = testResults.filter(r => 
    !r.passed && (r.details.includes('SECURITY VIOLATION') || r.details.includes('CRITICAL'))
  );
  
  if (securityViolations.length > 0) {
    console.log('\n🚨 CRITICAL SECURITY VIOLATIONS DETECTED:');
    securityViolations.forEach(r => {
      console.log(`   🚨 ${r.testName}: ${r.details}`);
    });
    console.log('\n⚠️  IMMEDIATE ACTION REQUIRED: Fix security issues before deployment!');
  }
  
  console.log('\n=====================================');
  
  return failedTests === 0;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Starting RLS Policy Validation Tests');
  console.log('========================================');
  
  try {
    await createTestUsers();
    await testCaseRLS();
    await testDocumentRLS();
    await testCasePartiesRLS();
    await testContactRLS();
    await testRPCFunctionSecurity();
    await testAuditLogging();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error(error.stack);
  } finally {
    await cleanup();
    const success = generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run tests if this script is executed directly
runTests();