#!/usr/bin/env node

/**
 * Test script to verify toast integration and error handling
 * This would have caught the showToast vs addToast issue
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔍 Testing Toast Integration...\n');

// Find all files that use useToast
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['node_modules/**'] });

let issues = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  
  // Check if file imports useToast
  if (content.includes('useToast')) {
    console.log(`📄 Checking ${file}...`);
    
    // Check what's destructured from useToast
    const useToastMatch = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*useToast\(\)/);
    if (useToastMatch) {
      const destructured = useToastMatch[1].split(',').map(s => s.trim());
      console.log(`   Destructured: ${destructured.join(', ')}`);
      
      // Check if they're using showToast (which doesn't exist)
      if (destructured.includes('showToast')) {
        issues.push({
          file,
          issue: 'Attempting to destructure "showToast" from useToast (should be "addToast")'
        });
      }
      
      // Check if they're calling showToast
      if (content.includes('showToast(')) {
        issues.push({
          file,
          issue: 'Calling showToast() which doesn\'t exist'
        });
      }
      
      // Check if addToast is called with correct structure
      const addToastCalls = content.match(/addToast\([^)]+\)/g);
      if (addToastCalls) {
        addToastCalls.forEach(call => {
          // Simple check - should have { message: ..., type: ... }
          if (!call.includes('message:') || !call.includes('type:')) {
            console.log(`   ⚠️  Possible incorrect addToast call: ${call.substring(0, 50)}...`);
          }
        });
      }
    }
  }
}

console.log('\n📊 Summary:');
if (issues.length === 0) {
  console.log('✅ No toast integration issues found!');
} else {
  console.log(`❌ Found ${issues.length} issue(s):\n`);
  issues.forEach(({ file, issue }) => {
    console.log(`   ${file}: ${issue}`);
  });
}

// Check ToastContext exports
console.log('\n🔍 Checking ToastContext exports...');
const toastContextPath = 'src/context/ToastContext.tsx';
const toastContext = readFileSync(toastContextPath, 'utf8');

// Check what ToastContext actually exports
const exportMatch = toastContext.match(/export\s+const\s+useToast[^{]*{[^}]+}/s);
if (exportMatch) {
  console.log('✅ ToastContext exports found');
  
  // Check return value
  if (toastContext.includes('return context;') && toastContext.includes('addToast:') && toastContext.includes('removeToast:')) {
    console.log('✅ useToast returns { addToast, removeToast }');
  }
}