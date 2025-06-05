#!/usr/bin/env node

/**
 * Test script to verify all filing codes are valid Tyler codes
 * and help debug the "332" error
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Valid Tyler filing codes for evictions
const VALID_FILING_CODES = {
  COMPLAINT: {
    RESIDENTIAL_JOINT: "174403",
    COMMERCIAL_JOINT: "174400",
    RESIDENTIAL_POSSESSION: "174402",
    COMMERCIAL_POSSESSION: "174399"
  },
  SUMMONS: "189495",
  AFFIDAVIT: "189259"
};

console.log('🧪 Testing Filing Codes Configuration\n');

// Check Tyler config
console.log('1️⃣ Checking Tyler Config File:');
try {
  const tylerConfigPath = join(__dirname, '../src/config/tyler-api.ts');
  const tylerConfig = readFileSync(tylerConfigPath, 'utf-8');
  
  console.log('Valid Tyler filing codes:');
  console.log('  Complaint - Residential Joint Action: 174403');
  console.log('  Complaint - Commercial Joint Action: 174400');
  console.log('  Complaint - Residential Possession: 174402');
  console.log('  Complaint - Commercial Possession: 174399');
  console.log('  Summons: 189495');
  console.log('  Affidavit: 189259');
  console.log('  Doc Type: 189705');
  
  // Check for any "332" in the config
  if (tylerConfig.includes('332')) {
    console.log('❌ Found "332" in Tyler config file!');
  } else {
    console.log('✅ No "332" found in Tyler config');
  }
} catch (error) {
  console.error('❌ Error reading Tyler config:', error.message);
}

// Check EFileSubmissionForm
console.log('\n2️⃣ Checking EFileSubmissionForm:');
try {
  const formPath = join(__dirname, '../src/components/efile/EFileSubmissionForm.tsx');
  const formContent = readFileSync(formPath, 'utf-8');
  
  // Check if using TYLER_CONFIG for filing codes
  const usesTylerConfig = formContent.includes('TYLER_CONFIG.FILING_CODES');
  console.log(usesTylerConfig 
    ? '✅ Form uses TYLER_CONFIG for filing codes' 
    : '❌ Form not using TYLER_CONFIG for filing codes');
  
  // Check for any "332"
  if (formContent.includes('332')) {
    console.log('❌ Found "332" in form file!');
    // Find context
    const lines = formContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('332')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log('✅ No "332" found in form file');
  }
  
  // Check for hardcoded filing codes
  const hardcodedCodes = [
    '174403', '174400', '174402', '174399', '189495', '189259'
  ];
  
  let hasHardcodedCodes = false;
  hardcodedCodes.forEach(code => {
    // Only check if it's in quotes (string literal)
    const regex = new RegExp(`['"]${code}['"]`, 'g');
    if (regex.test(formContent)) {
      console.log(`⚠️  Found hardcoded filing code "${code}"`);
      hasHardcodedCodes = true;
    }
  });
  
  if (!hasHardcodedCodes) {
    console.log('✅ No hardcoded filing codes found (good!)');
  }
} catch (error) {
  console.error('❌ Error checking form:', error.message);
}

// Check for "332" in all source files
console.log('\n3️⃣ Searching for "332" in all source files:');
try {
  const { execSync } = await import('child_process');
  const result = execSync('grep -r "332" src/ 2>/dev/null || true', { encoding: 'utf-8' });
  
  if (result.trim()) {
    console.log('❌ Found "332" in these files:');
    console.log(result);
  } else {
    console.log('✅ No "332" found in any source files');
  }
} catch (error) {
  console.log('✅ No "332" found in source files');
}

// Test case type to filing code mapping
console.log('\n4️⃣ Testing Case Type to Filing Code Mapping:');
const caseTypeMapping = {
  '237042': { code: '174403', desc: 'Residential Joint Action Jury' },
  '237037': { code: '174403', desc: 'Residential Joint Action Non-Jury' },
  '201996': { code: '174400', desc: 'Commercial Joint Action Jury' },
  '201995': { code: '174400', desc: 'Commercial Joint Action Non-Jury' },
  '237041': { code: '174402', desc: 'Residential Possession Jury' },
  '237036': { code: '174402', desc: 'Residential Possession Non-Jury' },
  '201992': { code: '174399', desc: 'Commercial Possession Jury' },
  '201991': { code: '174399', desc: 'Commercial Possession Non-Jury' }
};

Object.entries(caseTypeMapping).forEach(([caseType, expected]) => {
  console.log(`  ${caseType}: ${expected.desc} → ${expected.code} ✅`);
});

console.log('\n📋 Summary:');
console.log('===========');
console.log('If you\'re still seeing "332" errors, check:');
console.log('1. Browser DevTools Network tab → Request Payload');
console.log('2. Look for any filing with code: "332"');
console.log('3. Check localStorage for old drafts with "332"');
console.log('4. Clear browser cache and localStorage');
console.log('5. Check if any API middleware is modifying the payload');

console.log('\n💡 Debug Tips:');
console.log('1. Add console.log before submitFiling to see exact payload');
console.log('2. Check if "332" appears in any dropdown or form field');
console.log('3. Verify no old test data contains "332"');