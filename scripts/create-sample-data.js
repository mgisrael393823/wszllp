import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Create multiple sample cases with different statuses
    const sampleCases = [
      {
        id: uuidv4(),
        plaintiff: 'John Doe',
        defendant: 'ABC Corporation',
        address: '123 Main St, San Francisco, CA',
        status: 'SPS NOT SERVED'
      },
      {
        id: uuidv4(),
        plaintiff: 'Jane Smith',
        defendant: 'XYZ Properties LLC',
        address: '456 Oak Ave, Los Angeles, CA',
        status: 'SPS PENDING'
      },
      {
        id: uuidv4(),
        plaintiff: 'Wilson Property Management',
        defendant: 'Robert Johnson',
        address: '789 Pine St, Chicago, IL',
        status: 'SEND TO SPS'
      },
      {
        id: uuidv4(),
        plaintiff: 'Metro Apartments',
        defendant: 'Sarah Williams',
        address: '321 Elm Dr, Houston, TX',
        status: 'SPS SERVED'
      },
      {
        id: uuidv4(),
        plaintiff: 'Downtown Realty',
        defendant: 'Michael Brown',
        address: '654 Maple Ln, Miami, FL',
        status: 'SPS NOT SERVED'
      }
    ];
    
    console.log('Creating sample cases...');
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .insert(sampleCases)
      .select();
      
    if (caseError) {
      console.error('Error creating sample case:', caseError);
      return;
    }
    
    console.log('Sample cases created:', caseData);
    
    // Create a sample hearing for the first case
    if (caseData && caseData.length > 0) {
      const hearingId = uuidv4();
      const hearingDate = new Date();
      hearingDate.setDate(hearingDate.getDate() + 7); // Set hearing date to 7 days from now
      
      console.log('Creating sample hearing...');
      const { data: hearingData, error: hearingError } = await supabase
        .from('hearings')
        .insert({
          id: hearingId,
          case_id: caseData[0].id,
          court_name: 'San Francisco Superior Court',
          hearing_date: hearingDate.toISOString(),
          participants: ['Judge Smith', 'Attorney Johnson', 'Witness Brown'],
          outcome: 'Pending'
          // Let the database handle timestamps with default values
        })
        .select();
      
      if (hearingError) {
        console.error('Error creating sample hearing:', hearingError);
        return;
      }
      
      console.log('Sample hearing created:', hearingData);
    }
    
    console.log('Sample data creation completed successfully!');
    
  } catch (error) {
    console.error('Exception when creating sample data:', error);
  }
}

createSampleData().catch(console.error);