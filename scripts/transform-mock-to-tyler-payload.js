#!/usr/bin/env node

/**
 * Transform mock payload to valid Tyler API format
 * Following exact requirements from Tyler API documentation
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to download file from URL
async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

// Helper function to convert file to base64
function fileToBase64(buffer) {
  return buffer.toString('base64');
}

async function transformMockPayload(mockPayloadPath) {
  console.log('🔧 Starting payload transformation...\n');

  // 1. Load the mock payload
  let payload;
  try {
    const rawJson = fs.readFileSync(mockPayloadPath, 'utf8');
    payload = JSON.parse(rawJson);
    console.log('✅ Step 1: Loaded mock payload');
  } catch (error) {
    console.error('❌ Error loading mock payload:', error.message);
    process.exit(1);
  }

  // Ensure data wrapper exists
  if (!payload.data) {
    payload = { data: payload };
  }

  // 3. Validate and fix top-level fields
  payload.data.reference_id = payload.data.reference_id || 'DRAFT386392';
  payload.data.jurisdiction = 'cook:cvd1';  // Cook County District 1, Civil
  payload.data.case_category = '7';         // Eviction
  payload.data.case_type = '237037';        // Residential Joint Action Non-Jury
  payload.data.filing_type = 'EFile';       // or 'EFileAndServe'
  payload.data.state = 'il';                // Illinois
  console.log('✅ Step 3: Fixed top-level fields');

  // 4. Add required attorney and payment fields
  payload.data.filing_attorney_id = '81d6ab59-3c7b-4e2c-8ed6-da4148d6353c';
  payload.data.filing_party_id = 'Party_653222202';  // plaintiff party ID
  payload.data.payment_account_id = 'a04b9fd2-ab8f-473c-a080-78857520336b';
  console.log('✅ Step 4: Added attorney and payment fields');

  // 5. Add amount in controversy
  payload.data.amount_in_controversy = '1500';
  payload.data.show_amount_in_controversy = 'true';
  console.log('✅ Step 5: Added amount in controversy');

  // 6. Verify and fix case_parties
  if (!payload.data.case_parties || payload.data.case_parties.length === 0) {
    // Create default parties if missing
    payload.data.case_parties = [
      {
        id: 'Party_653222202',
        type: '189138',  // Plaintiff
        first_name: 'Test',
        last_name: 'Plaintiff',
        is_business: 'false'
      },
      {
        id: 'Party_653222203',
        type: '189131',  // Defendant
        first_name: 'Test',
        last_name: 'Defendant',
        is_business: 'false'
      }
    ];
  }

  payload.data.case_parties.forEach(party => {
    if (party.type === '189138') {  // Plaintiff
      party.is_business = party.is_business || 'false';
      party.address_line_1 = party.address_line_1 || '943 N Kingsbury St';
      party.city = party.city || 'Chicago';
      party.state = party.state || 'IL';
      party.zip_code = party.zip_code || '60610';
      party.phone_number = party.phone_number || '8479242888';
      party.email = party.email || 'misrael00@gmail.com';
      party.lead_attorney = payload.data.filing_attorney_id;
    }
    if (party.type === '189131') {  // Defendant
      party.is_business = party.is_business || 'false';
      party.address_line_1 = party.address_line_1 || '943 N Kingsbury St';
      party.city = party.city || 'Chicago';
      party.state = party.state || 'IL';
      party.zip_code = party.zip_code || '60610';
      party.phone_number = party.phone_number || '8479242888';
      party.email = party.email || 'misrael00@gmail.com';
    }
  });
  console.log('✅ Step 6: Fixed case parties');

  // 7. Add cross_references for Joint Action
  payload.data.cross_references = [{ number: '44113', code: '190860' }];
  console.log('✅ Step 7: Added cross references');

  // 8. Prepare filings
  if (!payload.data.filings) {
    payload.data.filings = [];
  }

  // 8a. Process Complaint (first filing)
  if (payload.data.filings[0]) {
    const filing = payload.data.filings[0];
    
    // If file is a URL, download and convert to base64
    if (filing.file && filing.file.startsWith('http')) {
      try {
        console.log('   Downloading complaint PDF...');
        const fileBuffer = await downloadFile(filing.file);
        const base64Content = fileToBase64(fileBuffer);
        filing.file = `base64://${base64Content}`;
        console.log('   ✓ Converted complaint to base64');
      } catch (error) {
        console.warn('   ⚠️  Could not download complaint, using placeholder');
        filing.file = 'base64://JVBERi0xLjQKJeLjz9M='; // Minimal PDF placeholder
      }
    }
    
    filing.code = '174403';
    filing.description = 'Complaint / Petition - Eviction - Residential - Joint Action';
    filing.file_name = filing.file_name || 'Eviction_Complaint.pdf';
    filing.doc_type = '189705';
    
    // Remove optional_services
    delete filing.optional_services;
  }

  // 8b. Process Summons (second filing)
  if (payload.data.filings[1]) {
    const filing = payload.data.filings[1];
    
    if (filing.file && filing.file.startsWith('http')) {
      try {
        console.log('   Downloading summons PDF...');
        const fileBuffer = await downloadFile(filing.file);
        const base64Content = fileToBase64(fileBuffer);
        filing.file = `base64://${base64Content}`;
        console.log('   ✓ Converted summons to base64');
      } catch (error) {
        console.warn('   ⚠️  Could not download summons, using placeholder');
        filing.file = 'base64://JVBERi0xLjQKJeLjz9M=';
      }
    }
    
    filing.code = '189495';
    filing.description = 'Summons - Issued And Returnable';
    filing.file_name = filing.file_name || 'Summons.pdf';
    filing.doc_type = '189705';
  }

  // 8c. Add Affidavit (third filing)
  if (!payload.data.filings[2]) {
    // Check if we have a local affidavit file
    const affidavitPath = path.join(__dirname, '../docs/api/e-filing/samples/eviction_affidavit_template.pdf');
    let affidavitBase64;
    
    if (fs.existsSync(affidavitPath)) {
      console.log('   Reading local affidavit template...');
      const affidavitBuffer = fs.readFileSync(affidavitPath);
      affidavitBase64 = fileToBase64(affidavitBuffer);
      console.log('   ✓ Loaded affidavit template');
    } else {
      console.log('   ⚠️  No affidavit template found, using placeholder');
      affidavitBase64 = 'JVBERi0xLjQKJeLjz9M='; // Minimal PDF placeholder
    }
    
    payload.data.filings.push({
      code: '189259',
      description: 'Affidavit Filed',
      file: `base64://${affidavitBase64}`,
      file_name: 'Affidavit.pdf',
      doc_type: '189705'
    });
  } else {
    // Fix existing affidavit
    const filing = payload.data.filings[2];
    filing.code = '189259';
    filing.description = 'Affidavit Filed';
    filing.doc_type = '189705';
  }
  
  console.log('✅ Step 8: Processed all filings');

  // 9. Verify we have exactly 3 filings
  if (payload.data.filings.length !== 3) {
    console.error(`❌ Error: Expected 3 filings, found ${payload.data.filings.length}`);
    process.exit(1);
  }

  // Verify each filing has required fields
  payload.data.filings.forEach((filing, index) => {
    const required = ['code', 'description', 'file', 'file_name', 'doc_type'];
    const missing = required.filter(field => !filing[field]);
    if (missing.length > 0) {
      console.error(`❌ Filing ${index} missing fields: ${missing.join(', ')}`);
      process.exit(1);
    }
  });
  console.log('✅ Step 9: Verified all filings have required fields');

  // 10. Output final JSON
  const finalJson = JSON.stringify(payload, null, 2);
  console.log('\n✅ Final E-File Payload:');
  console.log('=====================================\n');
  console.log(finalJson);
  console.log('\n=====================================');

  // Save to file
  const outputPath = mockPayloadPath.replace('.json', '_tyler_ready.json');
  fs.writeFileSync(outputPath, finalJson);
  console.log(`\n✅ Saved transformed payload to: ${outputPath}`);

  // 11. Optional dry-run
  if (process.argv.includes('--dry-run')) {
    console.log('\n📤 Performing dry-run POST to Tyler API...');
    
    const apiKey = process.env.TYLER_AUTH_TOKEN;
    if (!apiKey) {
      console.warn('⚠️  No TYLER_AUTH_TOKEN environment variable found');
      console.log('   Set it with: export TYLER_AUTH_TOKEN="your-auth-token"');
      return;
    }

    try {
      const response = await fetch('https://api.uslegalpro.com/v4/il/efile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authtoken': apiKey
        },
        body: finalJson
      });

      console.log(`📤 API Response Code: ${response.status}`);
      const responseBody = await response.text();
      console.log('📄 Response Body:\n', responseBody);
    } catch (error) {
      console.error('❌ API call failed:', error.message);
    }
  }
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: node transform-mock-to-tyler-payload.js <mock_payload.json> [--dry-run]');
  console.log('\nExample:');
  console.log('  node transform-mock-to-tyler-payload.js mock_payload.json');
  console.log('  node transform-mock-to-tyler-payload.js mock_payload.json --dry-run');
  process.exit(1);
}

const mockPayloadPath = process.argv[2];
if (!fs.existsSync(mockPayloadPath)) {
  console.error(`❌ File not found: ${mockPayloadPath}`);
  process.exit(1);
}

// Run transformation
transformMockPayload(mockPayloadPath).catch(error => {
  console.error('❌ Transformation failed:', error);
  process.exit(1);
});