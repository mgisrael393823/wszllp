#!/usr/bin/env node

/**
 * Production Hotfix Script
 * Fixes:
 * 1. Removes sample cases from production
 * 2. Provides instructions for dashboard materialized view
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Production Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 WSZ LLP Production Hotfix\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  // Step 1: Check and remove sample cases
  console.log('📋 Step 1: Checking for sample cases...');
  
  try {
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching cases:', error);
      return;
    }
    
    console.log(`Found ${cases?.length || 0} total cases`);
    
    // Identify sample cases
    const samplePatterns = [
      'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 
      'Charlie Brown', 'Test', 'Sample', 'Demo'
    ];
    
    const sampleCases = cases?.filter(c => {
      const caseText = `${c.plaintiff} ${c.defendant} ${c.address || ''}`.toLowerCase();
      return samplePatterns.some(pattern => 
        caseText.includes(pattern.toLowerCase())
      );
    }) || [];
    
    if (sampleCases.length > 0) {
      console.log(`\n⚠️  Found ${sampleCases.length} sample cases to remove:`);
      for (const c of sampleCases) {
        console.log(`   - ${c.plaintiff} v. ${c.defendant} (ID: ${c.id})`);
      }
      
      console.log('\n🗑️  Removing sample cases...');
      for (const c of sampleCases) {
        const { error: deleteError } = await supabase
          .from('cases')
          .delete()
          .eq('id', c.id);
        
        if (deleteError) {
          console.error(`❌ Failed to delete case ${c.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted case: ${c.plaintiff} v. ${c.defendant}`);
        }
      }
    } else {
      console.log('✅ No sample cases found');
    }
    
  } catch (error) {
    console.error('❌ Error during case cleanup:', error);
  }
  
  // Step 2: Dashboard view instructions
  console.log('\n📋 Step 2: Dashboard Materialized View');
  console.log('\n⚠️  The dashboard metrics require a materialized view.');
  console.log('   The app now includes a fallback to query data directly,');
  console.log('   but for better performance, create the view in Supabase:\n');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Run the migration file:');
  console.log('      supabase/migrations/20250526000000_create_dashboard_materialized_views.sql\n');
  
  // Step 3: Final instructions
  console.log('📋 Step 3: Final Steps');
  console.log('\n1. Clear browser cache and localStorage:');
  console.log('   - Visit: /clear-localstorage.html');
  console.log('   - Or manually clear localStorage for your domain\n');
  console.log('2. Deploy the latest code changes');
  console.log('3. Test the application\n');
  
  console.log('✅ Hotfix script completed!');
}

main().catch(console.error);