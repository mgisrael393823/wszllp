#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDashboardViews() {
  console.log('🚀 Creating Dashboard Materialized Views\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, '../supabase/migrations/20250527000000_create_dashboard_materialized_views_fixed.sql');
  let sql;
  
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Loaded SQL migration file\n');
  } catch (error) {
    console.error('❌ Failed to read SQL file:', error);
    return;
  }
  
  // Split SQL into individual statements (simple split by semicolon)
  const statements = sql
    .split(/;\s*$/m)
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');
  
  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
  
  // Unfortunately, Supabase JS client doesn't support raw SQL execution
  // We need to use the Supabase SQL Editor or CLI
  
  console.log('⚠️  Note: The Supabase JavaScript client does not support raw SQL execution.\n');
  console.log('To create the dashboard views, you have these options:\n');
  console.log('Option 1: Supabase Dashboard (Recommended)');
  console.log('1. Go to: https://supabase.com/dashboard/project/karvbtpygbavvqydfcju/sql');
  console.log('2. Click "New Query"');
  console.log('3. Copy and paste the contents of:');
  console.log(`   ${sqlPath}`);
  console.log('4. Click "Run"\n');
  
  console.log('Option 2: Using Supabase CLI (if you have database password)');
  console.log('1. Run: npx supabase db push --password YOUR_DB_PASSWORD');
  console.log('2. Or set POSTGRES_PASSWORD environment variable and run: npx supabase db push\n');
  
  console.log('Option 3: Direct PostgreSQL connection');
  console.log('If you have a PostgreSQL client, connect directly and run the SQL file.\n');
  
  // Test if views were created
  console.log('🧪 Testing if views already exist...\n');
  
  try {
    const { data, error } = await supabase
      .from('dashboard_combined_metrics')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ Dashboard views already exist!');
      console.log('   The dashboard should now work without errors.');
      return;
    }
    
    if (error.code === '42P01') {
      console.log('❌ Dashboard views do not exist yet.');
      console.log('   Please create them using one of the options above.');
    }
  } catch (err) {
    console.log('❌ Could not check view existence');
  }
  
  // Output the first few lines of SQL for reference
  console.log('\n📄 SQL Preview (first 10 lines):');
  console.log('=====================================');
  const lines = sql.split('\n').slice(0, 10);
  lines.forEach(line => console.log(line));
  console.log('...\n');
}

createDashboardViews().catch(console.error);