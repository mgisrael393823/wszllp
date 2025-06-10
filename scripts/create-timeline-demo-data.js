import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTimelineDemoData() {
  try {
    console.log('Creating timeline demo data...');
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      // Try to use a default user ID if auth fails
      const user_id = 'demo-user-id';
      console.log('Using demo user ID:', user_id);
    }
    const user_id = user?.id || 'demo-user-id';

    // Create a sample case
    const caseData = {
      plaintiff: 'Johnson Property Management',
      defendant: 'Sarah Mitchell',
      address: '123 Main Street, Apt 4B, San Francisco, CA 94105',
      status: 'Active',
      intakeDate: '2024-01-15',
      user_id: user_id
    };

    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert([caseData])
      .select()
      .single();

    if (caseError) {
      console.error('Error creating case:', caseError);
      return;
    }

    console.log('Created case:', newCase.id);

    // Create hearings
    const hearings = [
      {
        caseId: newCase.id,
        hearing_date: '2024-02-15T10:00:00',
        court_name: 'San Francisco Superior Court',
        outcome: 'Continuance granted',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        hearing_date: '2024-03-20T14:00:00',
        court_name: 'San Francisco Superior Court',
        outcome: 'Judgment for plaintiff',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        hearing_date: '2025-01-15T09:00:00',
        court_name: 'San Francisco Superior Court',
        outcome: null, // Future hearing
        user_id: user_id
      }
    ];

    const { error: hearingError } = await supabase
      .from('hearings')
      .insert(hearings);

    if (hearingError) {
      console.error('Error creating hearings:', hearingError);
    } else {
      console.log('Created hearings');
    }

    // Create documents
    const documents = [
      {
        caseId: newCase.id,
        type: 'Complaint',
        status: 'Served',
        notes: 'Initial eviction complaint filed',
        upload_date: '2024-01-16',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        type: 'Summons',
        status: 'Served',
        notes: 'Summons served to defendant',
        upload_date: '2024-01-20',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        type: 'Answer',
        status: 'Filed',
        notes: 'Defendant response received',
        upload_date: '2024-02-01',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        type: 'Motion',
        status: 'Pending',
        notes: 'Motion for summary judgment',
        upload_date: '2024-12-20',
        user_id: user_id
      }
    ];

    const { error: docError } = await supabase
      .from('documents')
      .insert(documents);

    if (docError) {
      console.error('Error creating documents:', docError);
    } else {
      console.log('Created documents');
    }

    // Create invoices
    const invoices = [
      {
        caseId: newCase.id,
        amount: 850.00,
        issue_date: '2024-01-20',
        due_date: '2024-02-20',
        paid: true,
        description: 'Filing fees and initial consultation',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        amount: 1250.00,
        issue_date: '2024-02-15',
        due_date: '2024-03-15',
        paid: true,
        description: 'Court representation - February hearing',
        user_id: user_id
      },
      {
        caseId: newCase.id,
        amount: 2500.00,
        issue_date: '2024-12-01',
        due_date: '2025-01-01',
        paid: false,
        description: 'Legal services - December',
        user_id: user_id
      }
    ];

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoices);

    if (invoiceError) {
      console.error('Error creating invoices:', invoiceError);
    } else {
      console.log('Created invoices');
    }

    // Create audit logs for status changes
    const auditLogs = [
      {
        entity_id: newCase.id,
        entity_type: 'Case',
        action: 'Update',
        user_id: user_id,
        timestamp: '2024-02-15T15:30:00',
        details: 'Case status updated',
        metadata: {
          changes: {
            status: {
              old: 'Pending',
              new: 'Active'
            }
          }
        }
      },
      {
        entity_id: newCase.id,
        entity_type: 'Case',
        action: 'Update',
        user_id: user_id,
        timestamp: '2024-03-20T16:00:00',
        details: 'Case status updated after judgment',
        metadata: {
          changes: {
            status: {
              old: 'Active',
              new: 'Judgment Entered'
            }
          }
        }
      }
    ];

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogs);

    if (auditError) {
      console.error('Error creating audit logs:', auditError);
    } else {
      console.log('Created audit logs');
    }

    console.log('\nTimeline demo data created successfully!');
    console.log(`\nView the case at: http://localhost:5178/cases/${newCase.id}`);
    
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

createTimelineDemoData();