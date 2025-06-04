#!/usr/bin/env node

/**
 * Script to check and create dashboard views if missing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDashboardViews() {
  console.log('🔍 Checking dashboard views...\n');

  try {
    // Check if dashboard_combined_metrics exists
    const { data, error } = await supabase
      .from('dashboard_combined_metrics')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ dashboard_combined_metrics view not found:', error.message);
      console.log('\n📋 The view needs to be created. Here\'s what to do:\n');
      
      console.log('1. Go to your Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/karvbtpygbavvqydfcju/editor\n');
      
      console.log('2. Click on "SQL Editor" in the left sidebar\n');
      
      console.log('3. Run this SQL to create the missing view:');
      console.log(`
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_combined_metrics AS
SELECT 
  -- Case metrics
  COUNT(DISTINCT c.id) as total_cases,
  COUNT(DISTINCT CASE WHEN c.status = 'Active' THEN c.id END) as active_cases,
  COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as new_cases_30d,
  
  -- Hearing metrics
  COUNT(DISTINCT h.id) as total_hearings,
  COUNT(DISTINCT CASE WHEN h.hearing_date >= CURRENT_DATE THEN h.id END) as upcoming_hearings,
  COUNT(DISTINCT CASE WHEN h.hearing_date >= CURRENT_DATE AND h.hearing_date < CURRENT_DATE + INTERVAL '7 days' THEN h.id END) as hearings_this_week,
  
  -- Document metrics (if documents table exists)
  0 as total_documents,
  0 as documents_uploaded_30d,
  
  -- Contact metrics (if contacts table exists)
  0 as total_contacts,
  0 as new_contacts_30d,
  
  -- Last update time
  NOW() as last_updated
FROM cases c
LEFT JOIN hearings h ON c.id = h.case_id;

-- Create index for performance
CREATE UNIQUE INDEX idx_dashboard_combined_metrics ON dashboard_combined_metrics (last_updated);

-- Grant permissions
GRANT SELECT ON dashboard_combined_metrics TO authenticated;
GRANT SELECT ON dashboard_combined_metrics TO anon;
      `);
      
      console.log('\n4. After creating the view, refresh it periodically with:');
      console.log('   REFRESH MATERIALIZED VIEW dashboard_combined_metrics;\n');
    } else {
      console.log('✅ dashboard_combined_metrics view exists!');
      console.log('Sample data:', data);
    }

    // Check tables
    console.log('\n📊 Checking base tables...');
    
    const tables = ['cases', 'hearings', 'documents', 'contacts'];
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('id').limit(1);
      if (tableError) {
        console.log(`❌ ${table} table: Not found or no access`);
      } else {
        console.log(`✅ ${table} table: Exists and accessible`);
      }
    }

  } catch (err) {
    console.error('❌ Error checking views:', err);
  }
}

checkDashboardViews();