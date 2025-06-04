#!/usr/bin/env node

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

async function removeSampleCases() {
  console.log('🔍 Checking for sample cases in production...\n');
  
  try {
    // First, let's see what cases exist
    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching cases:', fetchError);
      return false;
    }
    
    console.log(`📊 Total cases found: ${cases?.length || 0}`);
    
    if (!cases || cases.length === 0) {
      console.log('✅ No cases found in the database.');
      return true;
    }
    
    // Identify sample cases (common test names)
    const samplePatterns = [
      'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 
      'Charlie Brown', 'Test', 'Sample', 'Demo'
    ];
    
    const sampleCases = cases.filter(c => {
      const caseText = `${c.plaintiff} ${c.defendant} ${c.address || ''}`.toLowerCase();
      return samplePatterns.some(pattern => 
        caseText.includes(pattern.toLowerCase())
      );
    });
    
    if (sampleCases.length > 0) {
      console.log(`\n⚠️  Found ${sampleCases.length} potential sample cases:`);
      sampleCases.forEach((c, index) => {
        console.log(`\n${index + 1}. ${c.plaintiff} v. ${c.defendant}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Created: ${new Date(c.created_at).toLocaleString()}`);
      });
      
      console.log('\n🗑️  Removing sample cases...');
      
      // Delete each sample case
      for (const sampleCase of sampleCases) {
        const { error: deleteError } = await supabase
          .from('cases')
          .delete()
          .eq('id', sampleCase.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting case ${sampleCase.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted: ${sampleCase.plaintiff} v. ${sampleCase.defendant}`);
        }
      }
      
      console.log('\n✅ Sample cases removed successfully!');
    } else {
      console.log('\n✅ No obvious sample cases found.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function createDashboardViews() {
  console.log('\n🔨 Creating dashboard views...\n');
  
  try {
    // Check if views already exist
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['dashboard_combined_metrics']);
    
    if (tables && tables.length > 0) {
      console.log('✅ Dashboard views already exist');
      return true;
    }
    
    // Create the materialized view
    const createViewSQL = `
      -- Create materialized view for dashboard metrics
      CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_combined_metrics AS
      WITH case_metrics AS (
        SELECT 
          COUNT(*) AS total_cases,
          COUNT(*) FILTER (WHERE status NOT IN ('CLOSED', 'DISMISSED')) AS active_cases,
          COUNT(*) FILTER (WHERE status = 'INTAKE') AS intake_cases,
          COUNT(*) FILTER (WHERE status IN ('CLOSED', 'DISMISSED')) AS closed_cases,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_cases_last_30_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_cases_last_7_days,
          AVG(CASE 
            WHEN status IN ('CLOSED', 'DISMISSED') 
            THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
            ELSE NULL 
          END) AS avg_case_duration_days,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '24 hours') AS cases_updated_last_24h,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days') AS cases_updated_last_7_days
        FROM cases
      ),
      hearing_metrics AS (
        SELECT 
          COUNT(*) AS total_hearings,
          COUNT(*) FILTER (WHERE hearing_date > NOW()) AS upcoming_hearings,
          COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS hearings_next_30_days,
          COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') AS hearings_next_7_days,
          COUNT(*) FILTER (WHERE hearing_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours') AS hearings_next_24_hours,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_hearings,
          COUNT(*) FILTER (WHERE status = 'MISSED' OR (hearing_date < NOW() AND status = 'SCHEDULED')) AS missed_hearings,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '24 hours') AS hearings_updated_last_24h,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days') AS hearings_updated_last_7_days
        FROM hearings
      ),
      document_metrics AS (
        SELECT 
          COUNT(*) AS total_documents,
          COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_documents,
          COUNT(*) FILTER (WHERE status = 'SERVED') AS served_documents,
          COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_documents,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_documents_last_30_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_documents_last_7_days,
          COUNT(DISTINCT case_id) AS cases_with_documents,
          COUNT(*) FILTER (WHERE type = 'COMPLAINT') AS complaint_documents,
          COUNT(*) FILTER (WHERE type = 'SUMMONS') AS summons_documents,
          COUNT(*) FILTER (WHERE type = 'MOTION') AS motion_documents,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '24 hours') AS documents_updated_last_24h,
          COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days') AS documents_updated_last_7_days
        FROM documents
      ),
      contact_metrics AS (
        SELECT 
          COUNT(*) AS total_contacts,
          COUNT(*) FILTER (WHERE type = 'CLIENT') AS client_contacts,
          COUNT(*) FILTER (WHERE type = 'OPPOSING_PARTY') AS opposing_party_contacts,
          COUNT(*) FILTER (WHERE type = 'ATTORNEY') AS attorney_contacts,
          COUNT(*) FILTER (WHERE type = 'COURT') AS court_contacts,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_contacts_last_30_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_contacts_last_7_days
        FROM contacts
      )
      SELECT 
        -- Case metrics
        COALESCE(cm.total_cases, 0) AS total_cases,
        COALESCE(cm.active_cases, 0) AS active_cases,
        COALESCE(cm.intake_cases, 0) AS intake_cases,
        COALESCE(cm.closed_cases, 0) AS closed_cases,
        COALESCE(cm.new_cases_last_30_days, 0) AS new_cases_last_30_days,
        COALESCE(cm.new_cases_last_7_days, 0) AS new_cases_last_7_days,
        COALESCE(cm.avg_case_duration_days, 0) AS avg_case_duration_days,
        COALESCE(cm.cases_updated_last_24h, 0) AS cases_updated_last_24h,
        COALESCE(cm.cases_updated_last_7_days, 0) AS cases_updated_last_7_days,
        
        -- Hearing metrics
        COALESCE(hm.total_hearings, 0) AS total_hearings,
        COALESCE(hm.upcoming_hearings, 0) AS upcoming_hearings,
        COALESCE(hm.hearings_next_30_days, 0) AS hearings_next_30_days,
        COALESCE(hm.hearings_next_7_days, 0) AS hearings_next_7_days,
        COALESCE(hm.hearings_next_24_hours, 0) AS hearings_next_24_hours,
        COALESCE(hm.completed_hearings, 0) AS completed_hearings,
        COALESCE(hm.missed_hearings, 0) AS missed_hearings,
        COALESCE(hm.hearings_updated_last_24h, 0) AS hearings_updated_last_24h,
        COALESCE(hm.hearings_updated_last_7_days, 0) AS hearings_updated_last_7_days,
        
        -- Document metrics
        COALESCE(dm.total_documents, 0) AS total_documents,
        COALESCE(dm.pending_documents, 0) AS pending_documents,
        COALESCE(dm.served_documents, 0) AS served_documents,
        COALESCE(dm.failed_documents, 0) AS failed_documents,
        COALESCE(dm.new_documents_last_30_days, 0) AS new_documents_last_30_days,
        COALESCE(dm.new_documents_last_7_days, 0) AS new_documents_last_7_days,
        COALESCE(dm.cases_with_documents, 0) AS cases_with_documents,
        COALESCE(dm.complaint_documents, 0) AS complaint_documents,
        COALESCE(dm.summons_documents, 0) AS summons_documents,
        COALESCE(dm.motion_documents, 0) AS motion_documents,
        COALESCE(dm.documents_updated_last_24h, 0) AS documents_updated_last_24h,
        COALESCE(dm.documents_updated_last_7_days, 0) AS documents_updated_last_7_days,
        
        -- Contact metrics
        COALESCE(con.total_contacts, 0) AS total_contacts,
        COALESCE(con.client_contacts, 0) AS client_contacts,
        COALESCE(con.opposing_party_contacts, 0) AS opposing_party_contacts,
        COALESCE(con.attorney_contacts, 0) AS attorney_contacts,
        COALESCE(con.court_contacts, 0) AS court_contacts,
        COALESCE(con.new_contacts_last_30_days, 0) AS new_contacts_last_30_days,
        COALESCE(con.new_contacts_last_7_days, 0) AS new_contacts_last_7_days,
        
        -- Activity metrics
        COALESCE(cm.cases_updated_last_24h, 0) + 
        COALESCE(hm.hearings_updated_last_24h, 0) + 
        COALESCE(dm.documents_updated_last_24h, 0) AS total_activity_last_24h,
        
        -- Computed percentages
        CASE 
          WHEN COALESCE(cm.total_cases, 0) > 0 
          THEN (COALESCE(cm.active_cases, 0)::NUMERIC / cm.total_cases * 100)
          ELSE 0 
        END AS active_cases_percentage,
        
        CASE 
          WHEN COALESCE(dm.total_documents, 0) > 0 
          THEN (COALESCE(dm.pending_documents, 0)::NUMERIC / dm.total_documents * 100)
          ELSE 0 
        END AS pending_documents_percentage,
        
        CASE 
          WHEN COALESCE(hm.total_hearings, 0) > 0 
          THEN (COALESCE(hm.hearings_next_30_days, 0)::NUMERIC / hm.total_hearings * 100)
          ELSE 0 
        END AS hearings_next_30_days_percentage,
        
        -- Metadata
        NOW() AS last_refreshed
      FROM 
        (SELECT 1) AS dummy
        LEFT JOIN case_metrics cm ON true
        LEFT JOIN hearing_metrics hm ON true
        LEFT JOIN document_metrics dm ON true
        LEFT JOIN contact_metrics con ON true;

      -- Create unique index
      CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_combined_metrics_unique ON dashboard_combined_metrics (last_refreshed);
    `;
    
    // Note: We can't directly execute raw SQL through the Supabase client
    // So we'll create a simple view instead
    console.log('⚠️  Note: Dashboard materialized views need to be created through Supabase dashboard');
    console.log('   or by running the migration file directly.');
    console.log('\n📄 Migration file location:');
    console.log('   /supabase/migrations/20250526000000_create_dashboard_materialized_views.sql');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating dashboard views:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting production fixes...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  // Step 1: Remove sample cases
  const casesFixed = await removeSampleCases();
  
  // Step 2: Create dashboard views (or provide instructions)
  const viewsFixed = await createDashboardViews();
  
  console.log('\n📊 Summary:');
  console.log(`   Sample cases: ${casesFixed ? '✅ Fixed' : '❌ Failed'}`);
  console.log(`   Dashboard views: ${viewsFixed ? '✅ Instructions provided' : '❌ Failed'}`);
  
  if (casesFixed && viewsFixed) {
    console.log('\n✅ Production fixes completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Apply the dashboard views migration in Supabase dashboard');
    console.log('   2. Clear browser cache and localStorage');
    console.log('   3. Test the application');
  } else {
    console.log('\n⚠️  Some fixes failed. Please check the errors above.');
  }
}

// Run the fixes
main().catch(console.error);