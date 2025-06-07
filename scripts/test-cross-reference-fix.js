#!/usr/bin/env node

/**
 * Test script to verify the cross-reference implementation fix
 * Tests three scenarios:
 * 1. Joint Action + no user input → should use "44113" with code "190860"
 * 2. Joint Action + valid user input → should use user's number/type
 * 3. Non-Joint + no input → should have no cross_references key
 */

// Simulate the cross-reference logic from EFileSubmissionForm.tsx
function buildCrossReferences(formData, caseType) {
  console.log(`\n=== Testing Case Type: ${caseType} ===`);
  console.log('Form Data:', {
    crossReferenceType: formData.crossReferenceType,
    crossReferenceNumber: formData.crossReferenceNumber
  });

  // helpers -----------------------------------------------------------------
  const jointActionTypes = ['237037', '237042', '201996', '201995'];

  // build cross_references *once* ------------------------------------------
  let crossRefNumber;
  let crossRefCode;

  // 1️⃣ user input validation - only accept 3-20 digit numbers
  if (formData.crossReferenceNumber?.trim() && 
      formData.crossReferenceType?.trim()) {
    const userNumber = formData.crossReferenceNumber.trim();
    if (/^\d{3,20}$/.test(userNumber)) {
      crossRefNumber = userNumber;
      crossRefCode = formData.crossReferenceType.trim();
      console.log('✓ Using valid user input');
    } else {
      console.log('✗ User input invalid (not 3-20 digits)');
    }
  }

  // 2️⃣ joint-action fallback - ALWAYS use 44113 (no random placeholders)
  if (!crossRefNumber && jointActionTypes.includes(caseType)) {
    crossRefNumber = '44113';
    crossRefCode = '190860'; // Case Number for Joint Actions
    console.log('✓ Using Joint Action fallback: 44113');
  }

  // 3️⃣ build result
  const result = {};
  if (crossRefNumber && crossRefCode) {
    result.cross_references = [{ number: crossRefNumber, code: crossRefCode }];
    console.log('✓ Cross-reference applied:', result.cross_references[0]);
  } else {
    console.log('✓ No cross_references (as expected)');
  }

  return result;
}

// Test scenarios
console.log('🧪 Testing Cross-Reference Implementation Fix\n');

// Test 1: Joint Action + no user input
console.log('📋 TEST 1: Joint Action with no user input');
const test1 = buildCrossReferences(
  { crossReferenceType: '', crossReferenceNumber: '' },
  '237042'
);
const expected1 = { cross_references: [{ number: '44113', code: '190860' }] };
console.log('Expected:', JSON.stringify(expected1, null, 2));
console.log('Actual:  ', JSON.stringify(test1, null, 2));
console.log('Result:  ', JSON.stringify(test1) === JSON.stringify(expected1) ? '✅ PASS' : '❌ FAIL');

// Test 2: Joint Action + valid user input
console.log('\n📋 TEST 2: Joint Action with valid user input');
const test2 = buildCrossReferences(
  { crossReferenceType: '190861', crossReferenceNumber: '12345' },
  '237037'
);
const expected2 = { cross_references: [{ number: '12345', code: '190861' }] };
console.log('Expected:', JSON.stringify(expected2, null, 2));
console.log('Actual:  ', JSON.stringify(test2, null, 2));
console.log('Result:  ', JSON.stringify(test2) === JSON.stringify(expected2) ? '✅ PASS' : '❌ FAIL');

// Test 3: Joint Action + invalid user input (should fallback to 44113)
console.log('\n📋 TEST 3: Joint Action with invalid user input (should fallback)');
const test3 = buildCrossReferences(
  { crossReferenceType: '190862', crossReferenceNumber: 'ABC123' }, // Invalid: contains letters
  '201996'
);
const expected3 = { cross_references: [{ number: '44113', code: '190860' }] };
console.log('Expected:', JSON.stringify(expected3, null, 2));
console.log('Actual:  ', JSON.stringify(test3, null, 2));
console.log('Result:  ', JSON.stringify(test3) === JSON.stringify(expected3) ? '✅ PASS' : '❌ FAIL');

// Test 4: Non-Joint Action + no input
console.log('\n📋 TEST 4: Non-Joint Action with no input');
const test4 = buildCrossReferences(
  { crossReferenceType: '', crossReferenceNumber: '' },
  '201992' // Possession case, not Joint Action
);
const expected4 = {};
console.log('Expected:', JSON.stringify(expected4, null, 2));
console.log('Actual:  ', JSON.stringify(test4, null, 2));
console.log('Result:  ', JSON.stringify(test4) === JSON.stringify(expected4) ? '✅ PASS' : '❌ FAIL');

// Test 5: Edge case - number too short
console.log('\n📋 TEST 5: Joint Action with too short user input (should fallback)');
const test5 = buildCrossReferences(
  { crossReferenceType: '190863', crossReferenceNumber: '12' }, // Too short
  '201995'
);
const expected5 = { cross_references: [{ number: '44113', code: '190860' }] };
console.log('Expected:', JSON.stringify(expected5, null, 2));
console.log('Actual:  ', JSON.stringify(test5, null, 2));
console.log('Result:  ', JSON.stringify(test5) === JSON.stringify(expected5) ? '✅ PASS' : '❌ FAIL');

// Test 6: Edge case - number too long
console.log('\n📋 TEST 6: Joint Action with too long user input (should fallback)');
const test6 = buildCrossReferences(
  { crossReferenceType: '190863', crossReferenceNumber: '123456789012345678901' }, // Too long (21 digits)
  '237042'
);
const expected6 = { cross_references: [{ number: '44113', code: '190860' }] };
console.log('Expected:', JSON.stringify(expected6, null, 2));
console.log('Actual:  ', JSON.stringify(test6, null, 2));
console.log('Result:  ', JSON.stringify(test6) === JSON.stringify(expected6) ? '✅ PASS' : '❌ FAIL');

console.log('\n🎯 Summary: All tests should show ✅ PASS for the fix to be working correctly');
console.log('\n💡 Key points:');
console.log('   • Joint Action cases always get cross_references');
console.log('   • User input is validated (3-20 digits only)');
console.log('   • Invalid input falls back to 44113');
console.log('   • Non-Joint cases get no cross_references');
console.log('   • No random placeholders are generated');