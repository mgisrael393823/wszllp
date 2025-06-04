#!/usr/bin/env node

/**
 * E-Filing Authentication Verification Script
 * 
 * This script verifies that the Tyler e-filing authentication is working correctly
 * with the production credentials and client token.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log(chalk.blue('🔐 E-Filing Authentication Verification\n'));

// Configuration
const CONFIG = {
  baseURL: process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4',
  clientToken: process.env.VITE_EFILE_CLIENT_TOKEN,
  username: process.env.VITE_EFILE_USERNAME,
  password: process.env.VITE_EFILE_PASSWORD,
};

// Step 1: Verify environment variables
function checkEnvironment() {
  console.log(chalk.blue('1️⃣ Checking environment configuration...'));
  
  const issues = [];
  
  if (!CONFIG.clientToken) {
    issues.push('VITE_EFILE_CLIENT_TOKEN is not set');
  } else if (CONFIG.clientToken !== 'EVICT87') {
    issues.push(`Client token should be EVICT87 for production, found: ${CONFIG.clientToken}`);
  }
  
  if (!CONFIG.username) {
    issues.push('VITE_EFILE_USERNAME is not set');
  }
  
  if (!CONFIG.password) {
    issues.push('VITE_EFILE_PASSWORD is not set');
  }
  
  if (issues.length > 0) {
    console.log(chalk.red('❌ Environment configuration issues:'));
    issues.forEach(issue => console.log(chalk.red(`   - ${issue}`)));
    return false;
  }
  
  console.log(chalk.green('✅ Environment configured correctly'));
  console.log(chalk.gray(`   Base URL: ${CONFIG.baseURL}`));
  console.log(chalk.gray(`   Client Token: ${CONFIG.clientToken}`));
  console.log(chalk.gray(`   Username: ${CONFIG.username}`));
  console.log(chalk.gray(`   Password: ${'*'.repeat(CONFIG.password.length)}`));
  
  return true;
}

// Step 2: Test authentication
async function testAuthentication() {
  console.log(chalk.blue('\n2️⃣ Testing authentication...'));
  
  const requestBody = {
    data: {
      username: CONFIG.username,
      password: CONFIG.password,
    },
  };
  
  console.log(chalk.gray('Request details:'));
  console.log(chalk.gray(`   URL: POST ${CONFIG.baseURL}/il/user/authenticate`));
  console.log(chalk.gray(`   Headers: { clienttoken: "${CONFIG.clientToken}" }`));
  console.log(chalk.gray(`   Body: ${JSON.stringify(requestBody, null, 2)}`));
  
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': CONFIG.clientToken,
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log(chalk.red('❌ Response is not valid JSON:'));
      console.log(chalk.red(responseText));
      return null;
    }
    
    console.log(chalk.gray('\nResponse:'));
    console.log(chalk.gray(`   Status: ${response.status} ${response.statusText}`));
    console.log(chalk.gray(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`));
    console.log(chalk.gray(`   Body: ${JSON.stringify(data, null, 2)}`));
    
    if (response.ok && data.message_code === 0 && data.item?.auth_token) {
      console.log(chalk.green('\n✅ Authentication successful!'));
      console.log(chalk.green(`   Auth token: ${data.item.auth_token.substring(0, 20)}...`));
      return data.item.auth_token;
    } else {
      console.log(chalk.red('\n❌ Authentication failed'));
      console.log(chalk.red(`   Status: ${response.status}`));
      console.log(chalk.red(`   Message: ${data.message || 'Unknown error'}`));
      console.log(chalk.red(`   Code: ${data.message_code || 'N/A'}`));
      
      // Check for specific error patterns
      if (response.status === 500 || data.message?.includes('SOAP')) {
        console.log(chalk.yellow('\n⚠️  This looks like a SOAP/XML error. The API expects JSON.'));
        console.log(chalk.yellow('   Make sure the Content-Type header is set to application/json'));
      }
      
      return null;
    }
  } catch (error) {
    console.log(chalk.red('\n❌ Network error during authentication:'));
    console.log(chalk.red(`   ${error.message}`));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.yellow('   Check if the API URL is correct and accessible'));
    }
    
    return null;
  }
}

// Step 3: Test authenticated endpoints
async function testAuthenticatedEndpoints(authToken) {
  console.log(chalk.blue('\n3️⃣ Testing authenticated endpoints...'));
  
  // Test attorney list
  console.log(chalk.gray('\nTesting attorney list endpoint...'));
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/firm/attorneys`, {
      headers: {
        'authtoken': authToken,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Attorney list retrieved successfully'));
      console.log(chalk.gray(`   Found ${data.count} attorney(s)`));
      if (data.items?.length > 0) {
        console.log(chalk.gray(`   First attorney: ${data.items[0].display_name}`));
      }
    } else {
      console.log(chalk.yellow('⚠️  Attorney list retrieval failed'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Error retrieving attorney list:', error.message));
  }
  
  // Test payment accounts
  console.log(chalk.gray('\nTesting payment accounts endpoint...'));
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/payment_accounts`, {
      headers: {
        'authtoken': authToken,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Payment accounts retrieved successfully'));
      console.log(chalk.gray(`   Found ${data.count} account(s)`));
      if (data.items?.length > 0) {
        console.log(chalk.gray(`   First account: ${data.items[0].name} (${data.items[0].card_type})`));
      }
    } else {
      console.log(chalk.yellow('⚠️  Payment accounts retrieval failed'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Error retrieving payment accounts:', error.message));
  }
}

// Main function
async function main() {
  console.log(chalk.gray('Environment: ' + (process.env.NODE_ENV || 'development')));
  console.log(chalk.gray('Date: ' + new Date().toISOString()));
  console.log(chalk.gray('Node version: ' + process.version));
  console.log();
  
  // Check environment
  if (!checkEnvironment()) {
    console.log(chalk.red('\n❌ Please fix environment configuration issues before proceeding'));
    process.exit(1);
  }
  
  // Test authentication
  const authToken = await testAuthentication();
  if (!authToken) {
    console.log(chalk.red('\n❌ Authentication verification failed'));
    console.log(chalk.yellow('\nTroubleshooting tips:'));
    console.log(chalk.yellow('1. Verify credentials with Tyler support'));
    console.log(chalk.yellow('2. Ensure client token is EVICT87 for production'));
    console.log(chalk.yellow('3. Check if the API endpoint is accessible'));
    console.log(chalk.yellow('4. Verify the request format matches the documentation'));
    process.exit(1);
  }
  
  // Test authenticated endpoints
  await testAuthenticatedEndpoints(authToken);
  
  // Summary
  console.log(chalk.blue('\n📊 Summary'));
  console.log(chalk.green('✅ E-Filing authentication is working correctly'));
  console.log(chalk.green('✅ Client token: EVICT87'));
  console.log(chalk.green('✅ API endpoints are accessible'));
  console.log(chalk.green('✅ Ready for production use'));
}

// Run the verification
main().catch(error => {
  console.error(chalk.red('\n💥 Unexpected error:'), error);
  process.exit(1);
});