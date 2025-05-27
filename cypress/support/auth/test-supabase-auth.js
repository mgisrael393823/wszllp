// Debug script to test Supabase authentication methods
// Run this with: node cypress/support/auth/test-supabase-auth.js

import axios from 'axios';

const SUPABASE_URL = 'https://karvbtpygbavvqydfcju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDk0MDksImV4cCI6MjA2MjM4NTQwOX0.dHTzkJ_IwXeBfR5QLDRLw8XZTVCmeLBMRi0oQgUX5wk';
const TEST_EMAIL = 'misrael00@gmail.com';
const TEST_PASSWORD = 'Typokeyboard23%!';

async function testAuthMethods() {
  console.log('Testing Supabase authentication methods...\n');

  // Method 1: Token endpoint with grant_type in query
  console.log('Method 1: /auth/v1/token?grant_type=password');
  try {
    const response1 = await axios.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success:', response1.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Method 2: Signup endpoint (for new users)
  console.log('Method 2: /auth/v1/signup');
  try {
    const response2 = await axios.post(
      `${SUPABASE_URL}/auth/v1/signup`,
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success:', response2.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Method 3: Using Supabase client library approach
  console.log('Method 3: Using @supabase/supabase-js client');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (error) {
      console.log('❌ Failed:', error);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('Note: This method requires @supabase/supabase-js to be installed');
  }
}

testAuthMethods();
