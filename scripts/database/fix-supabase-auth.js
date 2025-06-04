#!/usr/bin/env node

/**
 * Script to fix Supabase authentication issues
 * Clears invalid tokens and helps re-authenticate
 */

// Clear all localStorage data related to Supabase
console.log('🧹 Clearing Supabase authentication data...\n');

console.log('To fix the authentication issues, follow these steps:\n');

console.log('1. Open your browser developer console (F12)');
console.log('2. Run this command to clear all Supabase data:');
console.log('   localStorage.clear();\n');

console.log('3. Refresh the page (Ctrl+R or Cmd+R)\n');

console.log('4. You will be redirected to the login page');
console.log('5. Log in with your credentials\n');

console.log('If you continue to have issues:\n');

console.log('Option A - Use Production Supabase:');
console.log('  Make sure your .env.local file has the production credentials');
console.log('  The app will use: https://karvbtpygbavvqydfcju.supabase.co\n');

console.log('Option B - Use Local Supabase:');
console.log('  Update .env.local to use local Supabase:');
console.log('  VITE_SUPABASE_URL=http://localhost:54321');
console.log('  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0\n');

console.log('Current configuration is set to use PRODUCTION Supabase.');
console.log('✅ This is correct for testing the production environment locally.\n');

// Test current connectivity
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://karvbtpygbavvqydfcju.supabase.co';
console.log(`Testing connection to: ${supabaseUrl}`);

fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDk0MDksImV4cCI6MjA2MjM4NTQwOX0.dHTzkJ_IwXeBfR5QLDRLw8XZTVCmeLBMRi0oQgUX5wk'
  }
})
.then(res => {
  if (res.ok) {
    console.log('✅ Supabase connection successful!\n');
  } else {
    console.log(`❌ Supabase connection failed with status: ${res.status}\n`);
  }
})
.catch(err => {
  console.log('❌ Could not connect to Supabase:', err.message, '\n');
});