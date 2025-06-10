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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSimpleDemoCase() {
  try {
    console.log('Creating simple demo case...');
    
    // Create a sample case with minimal fields
    const caseData = {
      plaintiff: 'Johnson Property Management LLC',
      defendant: 'Sarah Mitchell',
      address: '123 Main Street, Apt 4B, San Francisco, CA 94105',
      status: 'Active',
      // Use a demo user ID since we're not authenticated
      user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
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

    console.log('Created case with ID:', newCase.id);
    console.log('Case data:', newCase);

    // Create some hearings
    const hearings = [
      {
        case_id: newCase.id,
        hearing_date: new Date('2024-02-15T10:00:00').toISOString(),
        outcome: 'Continuance granted',
        participants: ['Judge Smith', 'Attorney Jones', 'Sarah Mitchell'],
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        hearing_date: new Date('2024-03-20T14:00:00').toISOString(),
        outcome: 'Judgment for plaintiff',
        participants: ['Judge Smith', 'Attorney Jones', 'Sarah Mitchell'],
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        hearing_date: new Date('2025-01-15T09:00:00').toISOString(),
        outcome: null, // Future hearing
        participants: ['Judge TBD'],
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      }
    ];

    const { data: newHearings, error: hearingError } = await supabase
      .from('hearings')
      .insert(hearings)
      .select();

    if (hearingError) {
      console.error('Error creating hearings:', hearingError);
    } else {
      console.log('Created', newHearings.length, 'hearings');
    }

    // Create some documents
    const documents = [
      {
        case_id: newCase.id,
        type: 'Complaint',
        status: 'Served',
        notes: 'Initial eviction complaint filed',
        file_path: '/documents/complaint.pdf',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        type: 'Summons',
        status: 'Served',
        notes: 'Summons served to defendant',
        file_path: '/documents/summons.pdf',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        type: 'Motion',
        status: 'Pending',
        notes: 'Motion for summary judgment',
        file_path: '/documents/motion.pdf',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      }
    ];

    const { data: newDocs, error: docError } = await supabase
      .from('documents')
      .insert(documents)
      .select();

    if (docError) {
      console.error('Error creating documents:', docError);
    } else {
      console.log('Created', newDocs.length, 'documents');
    }

    // Create some invoices
    const invoices = [
      {
        case_id: newCase.id,
        amount: 850.00,
        issue_date: new Date('2024-01-20').toISOString(),
        due_date: new Date('2024-02-20').toISOString(),
        paid: true,
        description: 'Filing fees and initial consultation',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        amount: 1250.00,
        issue_date: new Date('2024-02-15').toISOString(),
        due_date: new Date('2024-03-15').toISOString(),
        paid: true,
        description: 'Court representation - February hearing',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: newCase.id,
        amount: 2500.00,
        issue_date: new Date('2024-12-01').toISOString(),
        due_date: new Date('2025-01-01').toISOString(),
        paid: false,
        description: 'Legal services - December',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      }
    ];

    const { data: newInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoices)
      .select();

    if (invoiceError) {
      console.error('Error creating invoices:', invoiceError);
    } else {
      console.log('Created', newInvoices.length, 'invoices');
    }

    console.log('\n✅ Demo data created successfully!');
    console.log(`\n🔗 View the case at: http://localhost:5178/cases/${newCase.id}`);
    console.log('\nThe case includes:');
    console.log('📅 Timeline tab: Case creation event + 3 hearings');
    console.log('💰 Financial tab: 3 invoices (2 paid, 1 unpaid) = $4,600 total');
    console.log('📄 Documents tab: 3 documents with different statuses');
    
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

createSimpleDemoCase();