#!/usr/bin/env node

/**
 * Debug production authentication issues
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

console.log('🔍 Debugging Production Authentication\n');

// Load local environment variables
dotenv.config({ path: '.env.local' });

const localConfig = {
  baseURL: process.env.VITE_EFILE_BASE_URL,
  clientToken: process.env.VITE_EFILE_CLIENT_TOKEN,
  username: process.env.VITE_EFILE_USERNAME,
  password: process.env.VITE_EFILE_PASSWORD,
};

console.log('1️⃣ Local Environment (working):');
console.log(`   Base URL: ${localConfig.baseURL}`);
console.log(`   Client Token: ${localConfig.clientToken ? `${localConfig.clientToken.substring(0, 3)}***` : 'NOT SET'}`);
console.log(`   Username: ${localConfig.username ? `${localConfig.username.substring(0, 3)}***` : 'NOT SET'}`);
console.log(`   Password: ${localConfig.password ? '***' : 'NOT SET'}`);

// Try to load production check file
try {
  const prodEnv = readFileSync('.env.production.check', 'utf8');
  const prodVars = {};
  prodEnv.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      prodVars[key.trim()] = value.trim();
    }
  });
  
  console.log('\n2️⃣ Production Environment:');
  console.log(`   Base URL: ${prodVars.VITE_EFILE_BASE_URL || 'NOT SET'}`);
  console.log(`   Client Token: ${prodVars.VITE_EFILE_CLIENT_TOKEN ? `${prodVars.VITE_EFILE_CLIENT_TOKEN.substring(0, 3)}***` : 'NOT SET'}`);
  console.log(`   Username: ${prodVars.VITE_EFILE_USERNAME ? `${prodVars.VITE_EFILE_USERNAME.substring(0, 3)}***` : 'NOT SET'}`);
  console.log(`   Password: ${prodVars.VITE_EFILE_PASSWORD ? '***' : 'NOT SET'}`);
  
  // Check for differences
  console.log('\n3️⃣ Configuration Check:');
  if (localConfig.clientToken !== prodVars.VITE_EFILE_CLIENT_TOKEN) {
    console.log('⚠️  Client tokens differ between local and production');
  }
  if (localConfig.baseURL !== prodVars.VITE_EFILE_BASE_URL) {
    console.log('⚠️  Base URLs differ between local and production');
  }
  
} catch (error) {
  console.log('\n❌ Could not read production environment file');
}

console.log('\n4️⃣ Common Issues:');
console.log('   - Client token should be EVICT87 for production');
console.log('   - Base URL should be https://api.uslegalpro.com/v4');
console.log('   - Credentials must match Tyler account exactly');
console.log('   - Check for extra spaces or quotes in Vercel env vars');

console.log('\n5️⃣ To update production variables:');
console.log('   vercel env rm VITE_EFILE_CLIENT_TOKEN production');
console.log('   vercel env add VITE_EFILE_CLIENT_TOKEN production');
console.log('   Then redeploy: vercel --prod');

// Clean up
console.log('\n🧹 Cleaning up...');
try {
  const fs = require('fs');
  fs.unlinkSync('.env.production.check');
  console.log('✅ Removed temporary file');
} catch (error) {
  // Ignore
}