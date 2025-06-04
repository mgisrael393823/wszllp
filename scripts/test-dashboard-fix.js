#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDashboardQueries() {
  console.log('🧪 Testing Dashboard Queries\n');
  
  // Test 1: Check if dashboard_combined_metrics exists
  console.log('Test 1: Checking dashboard_combined_metrics table...');
  try {
    const { data, error } = await supabase
      .from('dashboard_combined_metrics')
      .select('*')
      .single();
    
    if (error) {
      console.log(`❌ Table doesn't exist: ${error.message}`);
      console.log('   This is expected - the app should fall back to direct queries\n');
    } else {
      console.log('✅ Table exists and returned data\n');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  
  // Test 2: Check cases table with correct field names
  console.log('Test 2: Checking cases table with correct field names...');
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('id, plaintiff, defendant, updatedat, createdat')
      .order('updatedat', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error(`❌ Cases query failed: ${error.message}`);
      console.error('   Error details:', error);
    } else {
      console.log(`✅ Cases query successful, found ${data?.length || 0} cases`);
      if (data && data.length > 0) {
        console.log(`   Sample case: ${data[0].plaintiff} v. ${data[0].defendant}`);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  
  // Test 3: Check all tables exist
  console.log('\nTest 3: Checking all required tables...');
  const tables = ['cases', 'hearings', 'documents', 'contacts'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table '${table}' error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.error(`❌ Error checking table '${table}':`, err);
    }
  }
  
  console.log('\n✅ Test complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check browser console for any remaining errors');
  console.log('   2. Dashboard should now show metrics (even if zeros)');
  console.log('   3. Case details should be clickable without blank page');
}

testDashboardQueries().catch(console.error);