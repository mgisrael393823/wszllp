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

async function createTestDocumentWithFile() {
  try {
    console.log('Creating test document with file URL...');
    
    // Get first case
    const { data: cases } = await supabase
      .from('cases')
      .select('*')
      .limit(1);
      
    if (!cases || cases.length === 0) {
      console.error('No cases found');
      return;
    }
    
    const caseId = cases[0].id;
    
    // Create documents with different file types for testing
    const testDocuments = [
      {
        case_id: caseId,
        type: 'Order',
        status: 'Served',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: caseId,
        type: 'Motion',
        status: 'Pending',
        file_url: 'https://picsum.photos/800/600',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      },
      {
        case_id: caseId,
        type: 'Order',
        status: 'Served',
        file_url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Blank_PDF_Document.pdf',
        user_id: '1c699a7e-87e0-40bc-9cfb-c26e2d562061'
      }
    ];
    
    for (const doc of testDocuments) {
      const { data, error } = await supabase
        .from('documents')
        .insert(doc)
        .select()
        .single();
        
      if (error) {
        console.error(`Error creating ${doc.type}:`, error);
      } else {
        console.log(`✅ Created ${doc.type} with ID: ${data.id}`);
        console.log(`   View at: http://localhost:5178/documents/${data.id}`);
      }
    }
    
    console.log('\n📋 Test the DocumentViewer with these documents!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestDocumentWithFile();