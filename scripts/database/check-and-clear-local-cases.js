#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use development/local Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file');
  console.error('   Required: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkLocalCases() {
  console.log('🔍 Checking local database for cases...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
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
    
    if (cases.length === 0) {
      console.log('\n✅ No cases found in the database.');
      console.log('\n💡 If you still see cases in the UI, they might be in localStorage.');
      console.log('   Clear your browser\'s localStorage for localhost:5178');
      return;
    }
    
    console.log('\n📋 Case Details:');
    console.log('=====================================');
    
    cases.forEach((c, index) => {
      console.log(`\nCase ${index + 1}:`);
      console.log(`  ID: ${c.id}`);
      console.log(`  Plaintiff: ${c.plaintiff}`);
      console.log(`  Defendant: ${c.defendant}`);
      console.log(`  Address: ${c.address || 'N/A'}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Created: ${new Date(c.created_at).toLocaleString()}`);
    });
    
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
    
    // Ask if user wants to delete
    const answer = await question('\n❓ Do you want to delete ALL these cases? (yes/no): ');
    
    if (answer.toLowerCase() === 'yes') {
      console.log('\n🗑️  Deleting all cases...');
      
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)
      
      if (deleteError) {
        console.error('❌ Error deleting cases:', deleteError);
      } else {
        console.log('✅ All cases deleted successfully!');
        console.log('\n💡 Remember to also clear your browser\'s localStorage:');
        console.log('   1. Open Developer Tools (F12)');
        console.log('   2. Go to Application/Storage tab');
        console.log('   3. Find localStorage for localhost:5178');
        console.log('   4. Delete the "legalCaseData" key');
      }
    } else {
      console.log('\n❌ Deletion cancelled.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

// Run the check
checkLocalCases();