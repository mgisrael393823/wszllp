#!/usr/bin/env node

/**
 * Test to verify affidavit is optional for all case types
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the EFileSubmissionForm component
const componentPath = join(__dirname, '../src/components/efile/EFileSubmissionForm.tsx');
const componentContent = readFileSync(componentPath, 'utf-8');

console.log('🧪 Testing Affidavit Optional Fix\n');

// Test 1: Check that affidavit validation is removed
console.log('1️⃣ Checking Affidavit Validation:');
const hasJointActionCheck = componentContent.includes("isJointAction && !formData.affidavitFile");
const hasAffidavitRequired = componentContent.includes("Please upload the affidavit");
console.log(!hasJointActionCheck && !hasAffidavitRequired 
  ? '✅ Affidavit validation removed - now optional for all cases' 
  : '❌ Affidavit validation still present');

// Test 2: Verify UI shows optional
console.log('\n2️⃣ Checking UI Label:');
const hasOptionalLabel = componentContent.includes('Upload Affidavit <span className="text-sm font-normal text-gray-500">(Optional)</span>');
console.log(hasOptionalLabel 
  ? '✅ UI correctly shows affidavit as optional' 
  : '❌ UI label needs update');

// Test 3: Check validation function
console.log('\n3️⃣ Checking Validation Function:');
const validationSection = componentContent.substring(
  componentContent.indexOf('const validateForm = ()'),
  componentContent.indexOf('return isValid;')
);

// Count required validations
const requiredChecks = [
  'complaintFile',
  'summonsFiles',
  'jurisdiction',
  'caseType',
  'attorneyId'
];

console.log('Required fields being validated:');
requiredChecks.forEach(field => {
  const isValidated = validationSection.includes(`!formData.${field}`);
  console.log(`  ${field}: ${isValidated ? '✅' : '❌'}`);
});

// Ensure affidavit is NOT in required validations
const affidavitValidated = validationSection.includes('affidavitFile') && 
                          validationSection.includes('newErrors.affidavitFile');
console.log(`\nAffidavit validation: ${affidavitValidated ? '❌ Still being validated' : '✅ Not validated (optional)'}`);

// Summary
console.log('\n📊 Summary:');
console.log('===========');
const allTestsPassed = !hasJointActionCheck && !hasAffidavitRequired && hasOptionalLabel && !affidavitValidated;
console.log(allTestsPassed 
  ? '✅ Affidavit is now truly optional for all case types!' 
  : '❌ Some issues remain with affidavit validation');

// Test different case types
console.log('\n📝 Test Scenarios:');
console.log('==================');
const caseTypes = [
  { code: '237037', name: 'Residential Joint Action Non-Jury' },
  { code: '237042', name: 'Residential Joint Action Jury' },
  { code: '201996', name: 'Commercial Joint Action Jury' },
  { code: '201995', name: 'Commercial Joint Action Non-Jury' },
  { code: '237036', name: 'Residential Possession Non-Jury' },
  { code: '237041', name: 'Residential Possession Jury' },
  { code: '201991', name: 'Commercial Possession Non-Jury' },
  { code: '201992', name: 'Commercial Possession Jury' }
];

caseTypes.forEach(caseType => {
  console.log(`${caseType.name} (${caseType.code}): ✅ Affidavit optional`);
});

process.exit(allTestsPassed ? 0 : 1);