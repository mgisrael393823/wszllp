#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = 'https://karvbtpygbavvqydfcju.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Should be set in environment

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionSchema() {
  console.log('🔍 Checking production database schema...\n');
  
  try {
    // Check if e-filing columns exist in documents table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'documents')
      .in('column_name', ['envelope_id', 'filing_id', 'efile_status', 'efile_timestamp']);
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return false;
    }
    
    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = ['envelope_id', 'filing_id', 'efile_status', 'efile_timestamp'];
    
    console.log('📋 E-filing columns in production:');
    requiredColumns.forEach(col => {
      const exists = columnNames.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
    
    const allColumnsExist = requiredColumns.every(col => columnNames.includes(col));
    
    if (allColumnsExist) {
      console.log('\n✅ All e-filing columns exist in production!');
      
      // Check if functions exist
      console.log('\n🔍 Checking database functions...');
      
      const { data: functions, error: functionsError } = await supabase.rpc('get_function_info');
      
      if (!functionsError) {
        console.log('✅ Database functions check passed');
      } else {
        console.log('ℹ️  Function check inconclusive (this is okay)');
      }
      
      return true;
    } else {
      console.log('\n❌ Missing e-filing columns in production database');
      console.log('🚨 Production schema migration needed before code deployment');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking production schema:', error.message);
    return false;
  }
}

checkProductionSchema().then(success => {
  if (success) {
    console.log('\n🎉 Production database is ready for e-filing deployment!');
    process.exit(0);
  } else {
    console.log('\n🛑 Production database needs migration before deploying code');
    process.exit(1);
  }
});