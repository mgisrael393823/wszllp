#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Production Supabase configuration
const supabaseUrl = 'https://karvbtpygbavvqydfcju.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionCases() {
  console.log('🔍 Checking production database for cases...\n');
  
  try {
    // Fetch all cases
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching cases:', error);
      return;
    }
    
    console.log(`📊 Total cases found: ${cases.length}`);
    
    if (cases.length > 0) {
      console.log('\n📋 Case Details:');
      console.log('=====================================');
      
      cases.forEach((c, index) => {
        console.log(`\nCase ${index + 1}:`);
        console.log(`  ID: ${c.id}`);
        console.log(`  Plaintiff: ${c.plaintiff}`);
        console.log(`  Defendant: ${c.defendant}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Created: ${new Date(c.created_at).toLocaleString()}`);
        console.log(`  Updated: ${new Date(c.updated_at).toLocaleString()}`);
      });
      
      // Check for potential duplicates
      const plaintiffDefendantPairs = cases.map(c => `${c.plaintiff}|${c.defendant}`);
      const duplicates = plaintiffDefendantPairs.filter((item, index) => plaintiffDefendantPairs.indexOf(item) !== index);
      
      if (duplicates.length > 0) {
        console.log('\n⚠️  Potential duplicate cases detected:');
        console.log(duplicates);
      }
      
      // Check if these look like sample data
      const sampleDataNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
      const sampleCases = cases.filter(c => 
        sampleDataNames.some(name => 
          c.plaintiff.includes(name) || c.defendant.includes(name)
        )
      );
      
      if (sampleCases.length > 0) {
        console.log(`\n⚠️  Found ${sampleCases.length} cases that appear to be sample data`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkProductionCases();