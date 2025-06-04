#!/usr/bin/env node

/**
 * Verify production environment configuration
 */

console.log('🔍 Verifying Production Environment Configuration\n');

// Check Vercel environment variables
console.log('1️⃣ Checking Vercel CLI...');
const { execSync } = require('child_process');

try {
  // Check if vercel CLI is installed
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('✅ Vercel CLI is installed');
  
  // List environment variables (without exposing values)
  console.log('\n2️⃣ Production Environment Variables:');
  try {
    const envList = execSync('vercel env ls production', { encoding: 'utf-8' });
    console.log(envList);
  } catch (error) {
    console.log('❌ Unable to list production environment variables');
    console.log('   Make sure you are logged in: vercel login');
  }
} catch (error) {
  console.log('❌ Vercel CLI not installed. Run: npm i -g vercel');
}

console.log('\n3️⃣ Critical E-Filing Variables to Verify:');
const requiredVars = [
  'VITE_EFILE_BASE_URL',
  'VITE_EFILE_CLIENT_TOKEN', 
  'VITE_EFILE_USERNAME',
  'VITE_EFILE_PASSWORD',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('Required environment variables:');
requiredVars.forEach(varName => {
  console.log(`  - ${varName}`);
});

console.log('\n4️⃣ Tyler API Configuration:');
console.log('  - Base URL should be: https://api.uslegalpro.com/v4');
console.log('  - Client token should be: EVICT87');
console.log('  - Credentials must match Tyler account');

console.log('\n5️⃣ Common Issues:');
console.log('  ❓ SOAP Fault errors usually mean:');
console.log('     - Invalid username/password');
console.log('     - Wrong client token');
console.log('     - Account not activated');
console.log('     - Server issues at Tyler');

console.log('\n📝 To fix authentication issues:');
console.log('  1. Verify credentials with Tyler support');
console.log('  2. Check if account is active');
console.log('  3. Ensure client token is EVICT87');
console.log('  4. Update production variables: vercel env add VITE_EFILE_USERNAME production');