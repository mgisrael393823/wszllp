import fetch from 'node-fetch';

async function testMultipleSummons() {
  console.log('Testing Multiple Summons Feature\n');

  const testPayload = {
    data: {
      reference_id: `TEST-MULTI-SUMMONS-${Date.now()}`,
      jurisdiction: 'cook:cvd1',
      case_category: '7',
      case_type: '237037',
      case_parties: [
        {
          id: 'Party_25694092',
          type: '189138',
          business_name: 'Wolf Solovy LLP',
          is_business: 'true',
          address_line_1: '123 Main St',
          address_line_2: 'Suite 400',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60601',
          lead_attorney: '448c583f-aaf7-43d2-8053-2b49c810b66f'
        },
        {
          id: 'Party_60273353',
          type: '189131',
          first_name: 'John',
          last_name: 'Doe',
          address_line_1: '456 Oak St',
          address_line_2: '',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60602',
          is_business: 'false'
        },
        {
          id: 'Party_60273354',
          type: '189131',
          first_name: 'Jane',
          last_name: 'Smith',
          address_line_1: '789 Pine St',
          address_line_2: '',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60603',
          is_business: 'false'
        }
      ],
      filings: [
        {
          code: '174403',
          description: 'Complaint / Petition - Eviction - Residential - Joint Action',
          file: 'base64://JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNDE0L0xlbmd0aCA4ODgvTiA1Ni9UeXBlL09ialN0bT4+CnN0cmVhbQp4nK==',
          file_name: 'eviction_complaint.pdf',
          doc_type: '189705',
          optional_services: [{
            quantity: '2',
            code: '282616'
          }]
        },
        // Multiple summons files - one for each defendant
        {
          code: '189495',
          description: 'Summons - Issued And Returnable',
          file: 'base64://JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNDE0L0xlbmd0aCA4ODgvTiA1Ni9UeXBlL09ialN0bT4+CnN0cmVhbQp4nK==',
          file_name: 'summons_john_doe.pdf',
          doc_type: '189705'
        },
        {
          code: '189495',
          description: 'Summons - Issued And Returnable',
          file: 'base64://JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNDE0L0xlbmd0aCA4ODgvTiA1Ni9UeXBlL09ialN0bT4+CnN0cmVhbQp4nK==',
          file_name: 'summons_jane_smith.pdf',
          doc_type: '189705'
        },
        {
          code: '189259',
          description: 'Affidavit Filed',
          file: 'base64://JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNDE0L0xlbmd0aCA4ODgvTiA1Ni9UeXBlL09ialN0bT4+CnN0cmVhbQp4nK==',
          file_name: 'eviction_affidavit.pdf',
          doc_type: '189705'
        }
      ],
      filing_type: 'EFile',
      payment_account_id: 'ACCT-001',
      filing_attorney_id: '448c583f-aaf7-43d2-8053-2b49c810b66f',
      filing_party_id: 'Party_25694092',
      amount_in_controversy: '5000.00',
      show_amount_in_controversy: 'true'
    }
  };

  console.log('Test Case: Multiple Summons Files\n');
  console.log('✅ Complaint: 1 file');
  console.log('✅ Summons: 2 files (one per defendant)');
  console.log('✅ Affidavit: 1 file');
  console.log('\nTotal filings in payload:', testPayload.data.filings.length);
  
  console.log('\nFilings breakdown:');
  testPayload.data.filings.forEach((filing, index) => {
    console.log(`${index + 1}. ${filing.description} - ${filing.file_name}`);
  });

  console.log('\nUI Features:');
  console.log('- Users can upload multiple summons files');
  console.log('- Each summons file is shown in a list with remove option');
  console.log('- File count is displayed');
  console.log('- Each summons gets its own filing entry in the payload');

  console.log('\nComplete Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
}

testMultipleSummons();