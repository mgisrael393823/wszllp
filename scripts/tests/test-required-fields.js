import fetch from 'node-fetch';

async function testRequiredFields() {
  console.log('Testing Required Fields in E-Filing Payload\n');

  const testPayload = {
    data: {
      reference_id: `TEST-REQ-${Date.now()}`,
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
            quantity: '1',
            code: '282616'
          }]
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

  console.log('Checking Required Fields:\n');
  
  const requiredFields = [
    { field: 'amount_in_controversy', expected: '5000.00' },
    { field: 'show_amount_in_controversy', expected: 'true' },
    { field: 'filing_type', expected: 'EFile' },
    { field: 'filing_party_id', expected: 'Party_25694092' }
  ];

  requiredFields.forEach(({ field, expected }) => {
    const value = testPayload.data[field];
    const status = value === expected ? '✅' : '❌';
    console.log(`${status} ${field}: "${value}" (expected: "${expected}")`);
  });

  console.log('\nField Location Check:\n');
  console.log('1. amount_in_controversy:');
  console.log('   - UI: Visible input field for dollar amount');
  console.log('   - Payload: Included with value or empty string');
  
  console.log('\n2. show_amount_in_controversy:');
  console.log('   - UI: Checkbox visible to user');
  console.log('   - Payload: "true" or "false" string value');
  
  console.log('\n3. filing_type:');
  console.log('   - UI: Not visible (hardcoded)');
  console.log('   - Payload: Always "EFile"');
  
  console.log('\n4. filing_party_id:');
  console.log('   - UI: Not visible (derived from petitioner)');
  console.log('   - Payload: Always "Party_25694092"');

  console.log('\nComplete Test Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
}

testRequiredFields();