#!/usr/bin/env node

/**
 * Test script for e-filing fixes from PR #67
 * Tests:
 * 1. Joint Action cases properly use "44113" as default cross-reference
 * 2. Users can override the cross-reference if needed
 * 3. Possession cases don't require affidavit
 * 4. Multiple summons files are processed correctly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the EFileSubmissionForm component
const componentPath = join(__dirname, '../src/components/efile/EFileSubmissionForm.tsx');
const componentContent = readFileSync(componentPath, 'utf-8');

console.log('🧪 Testing E-Filing Fixes from PR #67\n');

// Test 1: Check Tyler Config import
console.log('1️⃣ Testing Tyler Config Import:');
const hasTylerConfigImport = componentContent.includes("import { TYLER_CONFIG } from '@/config/tyler-api'");
console.log(hasTylerConfigImport ? '✅ Tyler config properly imported' : '❌ Tyler config import missing');

// Test 2: Check affidavit validation logic
console.log('\n2️⃣ Testing Affidavit Validation:');
const affidavitValidationRegex = /const isJointAction = \['237037', '237042', '201996', '201995'\]\.includes\(formData\.caseType\);\s*if \(isJointAction && !formData\.affidavitFile\)/;
const hasCorrectAffidavitValidation = affidavitValidationRegex.test(componentContent);
console.log(hasCorrectAffidavitValidation 
  ? '✅ Affidavit only required for Joint Action cases' 
  : '❌ Affidavit validation incorrect');

// Test 3: Check cross-reference logic order
console.log('\n3️⃣ Testing Cross-Reference Priority:');
const crossRefContent = componentContent.substring(
  componentContent.indexOf('// Check user input FIRST'),
  componentContent.indexOf('// 3️⃣ attach only when we have')
);

// Check if user input is checked first
const userInputFirst = crossRefContent.indexOf('formData.crossReferenceNumber?.trim()') < 
                      crossRefContent.indexOf('jointActionTypes.includes(payload.case_type)');
console.log(userInputFirst 
  ? '✅ User input checked first (can override default)' 
  : '❌ Cross-reference priority incorrect');

// Check if 44113 is used as fallback
const usesTylerConfig = crossRefContent.includes('TYLER_CONFIG.ATTORNEY_CROSS_REF');
console.log(usesTylerConfig 
  ? '✅ Uses TYLER_CONFIG.ATTORNEY_CROSS_REF (44113) as fallback' 
  : '❌ Not using Tyler config for cross-reference');

// Test 4: Check phone/email values
console.log('\n4️⃣ Testing Phone/Email Values:');
const hardCodedPhoneRegex = /phone_number:\s*'8479242888'/;
const hardCodedEmailRegex = /email:\s*'misrael00@gmail\.com'/;
const hasHardCodedValues = hardCodedPhoneRegex.test(componentContent) || hardCodedEmailRegex.test(componentContent);
const hasEmptyPhoneEmail = /phone_number:\s*'',\s*email:\s*''/g.test(componentContent);

console.log(!hasHardCodedValues && hasEmptyPhoneEmail
  ? '✅ No hard-coded phone/email values (using empty strings)' 
  : '❌ Hard-coded values still present');

// Test 5: Check multiple summons processing
console.log('\n5️⃣ Testing Multiple Summons Processing:');
const summonsProcessingRegex = /\/\/ Process all summons files\s*for \(const summonsFile of formData\.summonsFiles\)/;
const hasMultipleSummonsSupport = summonsProcessingRegex.test(componentContent);
console.log(hasMultipleSummonsSupport 
  ? '✅ Processes all summons files (multiple file support)' 
  : '❌ Only processing single summons file');

// Test 6: Verify Tyler Config file exists
console.log('\n6️⃣ Testing Tyler Config File:');
try {
  const tylerConfigPath = join(__dirname, '../src/config/tyler-api.ts');
  const tylerConfigContent = readFileSync(tylerConfigPath, 'utf-8');
  
  const hasAttorneyRef = tylerConfigContent.includes('ATTORNEY_CROSS_REF: "44113"');
  const hasCrossRefCode = tylerConfigContent.includes('CROSS_REF_CODE: "190860"');
  const hasFilingCodes = tylerConfigContent.includes('FILING_CODES');
  
  console.log(hasAttorneyRef ? '✅ Attorney cross-ref set to "44113"' : '❌ Attorney cross-ref incorrect');
  console.log(hasCrossRefCode ? '✅ Cross-ref code set to "190860"' : '❌ Cross-ref code incorrect');
  console.log(hasFilingCodes ? '✅ Filing codes properly defined' : '❌ Filing codes missing');
} catch (error) {
  console.log('❌ Tyler config file not found');
}

// Summary
console.log('\n📊 Test Summary:');
console.log('================');
const tests = [
  hasTylerConfigImport,
  hasCorrectAffidavitValidation,
  userInputFirst,
  usesTylerConfig,
  !hasHardCodedValues && hasEmptyPhoneEmail,
  hasMultipleSummonsSupport
];
const passed = tests.filter(t => t).length;
const total = tests.length;

console.log(`Passed: ${passed}/${total} tests`);
console.log(passed === total ? '\n✅ All tests passed!' : '\n⚠️ Some tests failed');

// Generate payload examples for manual testing
console.log('\n📝 Sample Payloads for Manual Testing:');
console.log('=====================================');

console.log('\n1. Joint Action (should use 44113 if no user input):');
console.log(JSON.stringify({
  caseType: '237037',
  crossReferenceNumber: '',
  crossReferenceType: ''
}, null, 2));

console.log('\n2. Joint Action with user override:');
console.log(JSON.stringify({
  caseType: '237037',
  crossReferenceNumber: '12345',
  crossReferenceType: '190861'
}, null, 2));

console.log('\n3. Possession case (no affidavit required):');
console.log(JSON.stringify({
  caseType: '237036',
  affidavitFile: null
}, null, 2));

process.exit(passed === total ? 0 : 1);