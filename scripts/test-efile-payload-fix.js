#!/usr/bin/env node

/**
 * Test script to verify the eFiling payload matches Tyler's requirements
 * Tests the filing code logic, optional services, and cross references
 */

// Simulate the logic from EFileSubmissionForm.tsx
function buildEFilePayload(caseType, defendantCount, userCrossRef = null) {
  console.log(`\n=== Testing Case Type: ${caseType} ===`);
  
  // 1. Determine filing code based on case type
  let filingCode;
  let description;
  
  switch (caseType) {
    case '237042': // Residential Joint Action Jury
    case '237037': // Residential Joint Action Non-Jury
      filingCode = '174403';
      description = 'Complaint / Petition - Eviction - Residential - Joint Action';
      break;
    case '201996': // Commercial Joint Action Jury
    case '201995': // Commercial Joint Action Non-Jury
      filingCode = '174400';
      description = 'Complaint / Petition - Eviction - Commercial - Joint Action';
      break;
    case '237041': // Residential Possession Jury
    case '237036': // Residential Possession Non-Jury
      filingCode = '174402';
      description = 'Complaint / Petition - Eviction - Residential - Possession';
      break;
    case '201992': // Commercial Possession Jury
    case '201991': // Commercial Possession Non-Jury
      filingCode = '174399';
      description = 'Complaint / Petition - Eviction - Commercial - Possession';
      break;
    default:
      filingCode = '174403';
      description = 'Complaint / Petition - Eviction - Residential - Joint Action';
  }
  
  // 2. Determine if Joint Action (needs optional services)
  const isJointAction = ['237042', '237037', '201996', '201995'].includes(caseType);
  
  // 3. Build complaint filing
  const complaintFiling = {
    code: filingCode,
    description: description,
    file: 'base64://JVBERi0xLjQK...',
    file_name: 'complaint.pdf',
    doc_type: '189705'
  };
  
  // Add optional services only for Joint Action cases
  if (isJointAction) {
    complaintFiling.optional_services = [{
      quantity: defendantCount.toString(),
      code: '282616'
    }];
  }
  
  // 4. Build cross references
  const jointActionTypes = ['237037', '237042', '201996', '201995'];
  let crossRefNumber;
  let crossRefCode;
  
  // User input validation
  if (userCrossRef?.number?.trim() && userCrossRef?.type?.trim()) {
    const userNumber = userCrossRef.number.trim();
    if (/^\d{3,20}$/.test(userNumber)) {
      crossRefNumber = userNumber;
      crossRefCode = userCrossRef.type.trim();
      console.log('✓ Using valid user input for cross reference');
    } else {
      console.log('✗ User input invalid (not 3-20 digits)');
    }
  }
  
  // Joint action fallback
  if (!crossRefNumber && jointActionTypes.includes(caseType)) {
    crossRefNumber = '44113';
    crossRefCode = '190860';
    console.log('✓ Using Joint Action fallback: 44113');
  }
  
  // 5. Build complete payload
  const payload = {
    data: {
      reference_id: 'TEST-2025-001',
      jurisdiction: 'cook:cvd1',
      case_category: '7',
      case_type: caseType,
      case_parties: [
        {
          id: 'Party_25694092',
          type: '189138',
          business_name: 'Test Company LLC',
          is_business: 'true',
          lead_attorney: '448c583f-aaf7-43d2-8053-2b49c810b66f'
        },
        {
          id: 'Party_60273353',
          type: '189131',
          first_name: 'John',
          last_name: 'Doe',
          address_line_1: '123 Main St',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60601',
          is_business: 'false'
        }
      ],
      filings: [
        complaintFiling,
        {
          code: '189495',
          description: 'Summons - Issued And Returnable',
          file: 'base64://JVBERi0xLjQK...',
          file_name: 'summons.pdf',
          doc_type: '189705'
        }
      ],
      filing_type: 'EFile',
      payment_account_id: 'test-payment-account',
      filing_attorney_id: '448c583f-aaf7-43d2-8053-2b49c810b66f',
      filing_party_id: 'Party_25694092'
    }
  };
  
  // Add cross references if we have them
  if (crossRefNumber && crossRefCode) {
    payload.data.cross_references = [{ number: crossRefNumber, code: crossRefCode }];
  }
  
  return payload;
}

// Test scenarios
console.log('🧪 Testing eFiling Payload Generation\n');

// Test 1: Residential Joint Action (should have optional services + cross ref)
console.log('📋 TEST 1: Residential Joint Action (237037)');
const test1 = buildEFilePayload('237037', 2);
console.log('Filing Code:', test1.data.filings[0].code);
console.log('Has Optional Services:', !!test1.data.filings[0].optional_services);
console.log('Optional Service Quantity:', test1.data.filings[0].optional_services?.[0]?.quantity);
console.log('Has Cross References:', !!test1.data.cross_references);
console.log('Cross Reference Number:', test1.data.cross_references?.[0]?.number);
console.log('✅ Expected: Filing=174403, OptionalServices=true, CrossRef=44113');

// Test 2: Commercial Joint Action (should have optional services + cross ref)
console.log('\n📋 TEST 2: Commercial Joint Action (201996)');
const test2 = buildEFilePayload('201996', 1);
console.log('Filing Code:', test2.data.filings[0].code);
console.log('Has Optional Services:', !!test2.data.filings[0].optional_services);
console.log('Cross Reference Number:', test2.data.cross_references?.[0]?.number);
console.log('✅ Expected: Filing=174400, OptionalServices=true, CrossRef=44113');

// Test 3: Residential Possession (should NOT have optional services or cross ref)
console.log('\n📋 TEST 3: Residential Possession (237036)');
const test3 = buildEFilePayload('237036', 2);
console.log('Filing Code:', test3.data.filings[0].code);
console.log('Has Optional Services:', !!test3.data.filings[0].optional_services);
console.log('Has Cross References:', !!test3.data.cross_references);
console.log('✅ Expected: Filing=174402, OptionalServices=false, CrossRef=none');

// Test 4: Commercial Possession (should NOT have optional services or cross ref)
console.log('\n📋 TEST 4: Commercial Possession (201991)');
const test4 = buildEFilePayload('201991', 3);
console.log('Filing Code:', test4.data.filings[0].code);
console.log('Has Optional Services:', !!test4.data.filings[0].optional_services);
console.log('Has Cross References:', !!test4.data.cross_references);
console.log('✅ Expected: Filing=174399, OptionalServices=false, CrossRef=none');

// Test 5: Joint Action with valid user cross reference
console.log('\n📋 TEST 5: Joint Action with user cross reference');
const test5 = buildEFilePayload('237042', 2, { number: '12345', type: '190861' });
console.log('Cross Reference Number:', test5.data.cross_references?.[0]?.number);
console.log('Cross Reference Code:', test5.data.cross_references?.[0]?.code);
console.log('✅ Expected: CrossRef=12345 (user input, not 44113)');

console.log('\n🎯 Summary:');
console.log('All filing codes, optional services, and cross references');
console.log('should match Tyler API requirements exactly.');

// Show sample payloads
console.log('\n📄 Sample Joint Action Payload:');
console.log(JSON.stringify(test1, null, 2));

console.log('\n📄 Sample Possession Payload:');
console.log(JSON.stringify(test3, null, 2));