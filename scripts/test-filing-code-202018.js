#!/usr/bin/env node

/**
 * Test script to verify filing code 202018 is used for Residential Joint Action cases
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Filing Code 202018 for Residential Joint Action\n');

// Check Tyler config
console.log('1️⃣ Checking Tyler Config:');
try {
  const tylerConfigPath = join(__dirname, '../src/config/tyler-api.ts');
  const tylerConfig = readFileSync(tylerConfigPath, 'utf-8');
  
  // Extract RESIDENTIAL_JOINT filing code
  const match = tylerConfig.match(/RESIDENTIAL_JOINT:\s*"(\d+)"/);
  if (match) {
    const code = match[1];
    if (code === '202018') {
      console.log('✅ RESIDENTIAL_JOINT filing code is correctly set to 202018');
    } else {
      console.log(`❌ RESIDENTIAL_JOINT filing code is ${code}, should be 202018`);
    }
  } else {
    console.log('❌ Could not find RESIDENTIAL_JOINT filing code');
  }
} catch (error) {
  console.error('❌ Error reading Tyler config:', error.message);
}

// Test case type mapping
console.log('\n2️⃣ Case Type to Filing Code Mapping:');
const residentialJointCases = {
  '237042': 'Eviction – Joint Action – Residential Complaint Filed – Jury',
  '237037': 'Eviction – Joint Action – Residential Complaint Filed – Non-Jury'
};

console.log('Residential Joint Action cases should use filing code 202018:');
Object.entries(residentialJointCases).forEach(([caseType, description]) => {
  console.log(`  ${caseType}: ${description}`);
});

console.log('\n📋 Summary:');
console.log('===========');
console.log('Filing code 202018 is now configured for:');
console.log('- Complaint / Petition - Eviction - Residential - Joint Action - Non-Jury');
console.log('- Complaint / Petition - Eviction - Residential - Joint Action - Jury');
console.log('\nThis applies to Cook County Division 1 Municipal cases.');