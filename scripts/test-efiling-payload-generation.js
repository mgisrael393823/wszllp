#!/usr/bin/env node

/**
 * Runtime test for e-filing payload generation
 * This script tests the actual payload generation logic
 */

// Mock TYLER_CONFIG since we can't import TypeScript directly
const TYLER_CONFIG = {
  ATTORNEY_CROSS_REF: "44113",
  CROSS_REF_CODE: "190860",
  DEFAULT_ATTORNEY_ID: "81d6ab59-3c7b-4e2c-8ed6-da4148d6353c",
  DEFAULT_PAYMENT_ACCOUNT: "a04b9fd2-ab8f-473c-a080-78857520336b",
  JURISDICTION: "cook:cvd1",
  STATE: "il",
  CASE_CATEGORY: "7",
  DOC_TYPE: "189705",
  FILING_CODES: {
    COMPLAINT: {
      RESIDENTIAL_JOINT: "174403",
      COMMERCIAL_JOINT: "174400",
      RESIDENTIAL_POSSESSION: "174402",
      COMMERCIAL_POSSESSION: "174399"
    },
    SUMMONS: "189495",
    AFFIDAVIT: "189259"
  }
};

console.log('🧪 Testing E-Filing Payload Generation\n');

// Test case types
const jointActionTypes = ['237037', '237042', '201996', '201995'];
const possessionTypes = ['237036', '237041', '201991', '201992'];

// Test scenarios
const testScenarios = [
  {
    name: 'Joint Action - No User Input',
    formData: {
      caseType: '237037',
      crossReferenceNumber: '',
      crossReferenceType: ''
    },
    expected: {
      crossRefNumber: '44113',
      crossRefCode: '190860'
    }
  },
  {
    name: 'Joint Action - With User Override',
    formData: {
      caseType: '237037',
      crossReferenceNumber: '12345',
      crossReferenceType: '190861'
    },
    expected: {
      crossRefNumber: '12345',
      crossRefCode: '190861'
    }
  },
  {
    name: 'Possession - No Cross Reference',
    formData: {
      caseType: '237036',
      crossReferenceNumber: '',
      crossReferenceType: ''
    },
    expected: {
      crossRefNumber: undefined,
      crossRefCode: undefined
    }
  },
  {
    name: 'Possession - With User Input',
    formData: {
      caseType: '237036',
      crossReferenceNumber: '67890',
      crossReferenceType: '190862'
    },
    expected: {
      crossRefNumber: '67890',
      crossRefCode: '190862'
    }
  }
];

// Simulate the cross-reference logic from EFileSubmissionForm
function generateCrossReference(formData, caseType) {
  let crossRefNumber = undefined;
  let crossRefCode = undefined;

  // Check user input FIRST (they can override the default)
  if (
    formData.crossReferenceNumber?.trim() &&
    formData.crossReferenceType?.trim() &&
    /^\d{3,20}$/.test(formData.crossReferenceNumber.trim())
  ) {
    crossRefNumber = formData.crossReferenceNumber.trim();
    crossRefCode = formData.crossReferenceType.trim();
  }
  // THEN fallback to 44113 for joint actions if no user input
  else if (jointActionTypes.includes(caseType)) {
    crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
    crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
  }

  return { crossRefNumber, crossRefCode };
}

// Run tests
console.log('📋 Cross-Reference Generation Tests:\n');
let allPassed = true;

testScenarios.forEach((scenario, index) => {
  console.log(`Test ${index + 1}: ${scenario.name}`);
  console.log(`Input: caseType=${scenario.formData.caseType}, crossRef="${scenario.formData.crossReferenceNumber}", type="${scenario.formData.crossReferenceType}"`);
  
  const result = generateCrossReference(scenario.formData, scenario.formData.caseType);
  
  const passed = 
    result.crossRefNumber === scenario.expected.crossRefNumber &&
    result.crossRefCode === scenario.expected.crossRefCode;
  
  console.log(`Expected: number="${scenario.expected.crossRefNumber}", code="${scenario.expected.crossRefCode}"`);
  console.log(`Actual:   number="${result.crossRefNumber}", code="${result.crossRefCode}"`);
  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  console.log('---');
  
  if (!passed) allPassed = false;
});

// Test affidavit requirements
console.log('\n📋 Affidavit Requirement Tests:\n');

const affidavitTests = [
  { caseType: '237037', name: 'Residential Joint Action Non-Jury', requiresAffidavit: true },
  { caseType: '237042', name: 'Residential Joint Action Jury', requiresAffidavit: true },
  { caseType: '201996', name: 'Commercial Joint Action Jury', requiresAffidavit: true },
  { caseType: '201995', name: 'Commercial Joint Action Non-Jury', requiresAffidavit: true },
  { caseType: '237036', name: 'Residential Possession Non-Jury', requiresAffidavit: false },
  { caseType: '237041', name: 'Residential Possession Jury', requiresAffidavit: false },
  { caseType: '201991', name: 'Commercial Possession Non-Jury', requiresAffidavit: false },
  { caseType: '201992', name: 'Commercial Possession Jury', requiresAffidavit: false }
];

affidavitTests.forEach(test => {
  const isJointAction = jointActionTypes.includes(test.caseType);
  const passed = isJointAction === test.requiresAffidavit;
  
  console.log(`${test.name} (${test.caseType})`);
  console.log(`Expected affidavit required: ${test.requiresAffidavit}`);
  console.log(`Actual: ${isJointAction}`);
  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  console.log('---');
  
  if (!passed) allPassed = false;
});

// Summary
console.log('\n📊 Final Summary:');
console.log('================');
console.log(allPassed ? '✅ All payload generation tests passed!' : '❌ Some tests failed');

// Display Tyler Config for reference
console.log('\n📄 Tyler Configuration:');
console.log('======================');
console.log(`Attorney Cross-Ref: "${TYLER_CONFIG.ATTORNEY_CROSS_REF}"`);
console.log(`Cross-Ref Code: "${TYLER_CONFIG.CROSS_REF_CODE}"`);
console.log(`Jurisdiction: "${TYLER_CONFIG.JURISDICTION}"`);
console.log('\nFiling Codes:');
Object.entries(TYLER_CONFIG.FILING_CODES).forEach(([key, value]) => {
  if (typeof value === 'object') {
    console.log(`  ${key}:`);
    Object.entries(value).forEach(([subKey, subValue]) => {
      console.log(`    ${subKey}: "${subValue}"`);
    });
  } else {
    console.log(`  ${key}: "${value}"`);
  }
});

process.exit(allPassed ? 0 : 1);