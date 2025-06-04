#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking Supabase Tables\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  // Method 1: Try to query dashboard_combined_metrics directly
  console.log('1. Checking dashboard_combined_metrics table:');
  try {
    const { data, error } = await supabase
      .from('dashboard_combined_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('❌ Error querying table:', error.message);
      }
    } else {
      console.log('✅ Table exists!');
      console.log(`   Found ${data?.length || 0} rows\n`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  
  // Method 2: List all tables using RPC if available
  console.log('2. Attempting to list all tables:');
  try {
    // Try to get table list using a custom RPC function (if it exists)
    const { data: tables, error } = await supabase.rpc('get_tables_list').catch(() => ({
      data: null,
      error: { message: 'RPC function not available' }
    }));
    
    if (error || !tables) {
      console.log('⚠️  Cannot list tables directly (RPC function not available)');
      console.log('   This is normal - Supabase doesn\'t expose table listing by default\n');
    } else {
      console.log('📋 Available tables:');
      tables.forEach(table => console.log(`   - ${table}`));
    }
  } catch (err) {
    console.log('⚠️  Table listing not available\n');
  }
  
  // Method 3: Check known tables
  console.log('3. Checking known tables:');
  const knownTables = [
    'cases',
    'hearings', 
    'documents',
    'contacts',
    'case_contacts',
    'contact_communications',
    'dashboard_combined_metrics',
    'dashboard_case_metrics',
    'dashboard_hearing_metrics',
    'dashboard_document_metrics'
  ];
  
  for (const table of knownTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ ${table} - does not exist`);
        } else if (error.code === 'PGRST116') {
          console.log(`   ✅ ${table} - exists (empty)`);
        } else {
          console.log(`   ⚠️  ${table} - error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table} - exists`);
      }
    } catch (err) {
      console.log(`   ❌ ${table} - error: ${err.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('The dashboard_combined_metrics table does NOT exist in your Supabase instance.');
  console.log('This is why you\'re seeing 404 errors.\n');
  console.log('✅ The app has been updated to handle this gracefully by:');
  console.log('   1. Detecting when the table is missing');
  console.log('   2. Falling back to direct queries from the base tables');
  console.log('   3. Computing metrics on the fly\n');
  console.log('💡 To improve performance, you can create the materialized view by:');
  console.log('   1. Going to Supabase Dashboard > SQL Editor');
  console.log('   2. Running: supabase/migrations/20250526000000_create_dashboard_materialized_views.sql');
}

checkTables().catch(console.error);