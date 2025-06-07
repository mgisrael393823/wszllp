#!/usr/bin/env node

/**
 * Tyler Technologies Credential Verification Script
 * 
 * This script verifies Tyler Technologies API credentials before deployment.
 * Run this script after receiving verified credentials from Tyler support.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONFIG = {
  baseURL: process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4',
  clientToken: process.env.VITE_EFILE_CLIENT_TOKEN,
  username: process.env.VITE_EFILE_USERNAME,
  password: process.env.VITE_EFILE_PASSWORD,
};

console.log(chalk.blue('🔐 Tyler Technologies Credential Verification\n'));

// Verify all required environment variables are present
function checkEnvironmentVariables() {
  const missing = [];
  
  if (!CONFIG.clientToken) missing.push('VITE_EFILE_CLIENT_TOKEN');
  if (!CONFIG.username) missing.push('VITE_EFILE_USERNAME'); 
  if (!CONFIG.password) missing.push('VITE_EFILE_PASSWORD');
  
  if (missing.length > 0) {
    console.log(chalk.red('❌ Missing required environment variables:'));
    missing.forEach(variable => {
      console.log(chalk.red(`   - ${variable}`));
    });
    console.log(chalk.yellow('\nPlease add these variables to your .env.local file\n'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ All environment variables present'));
}

// Test authentication with Tyler Technologies API
async function testAuthentication() {
  console.log(chalk.blue('🔍 Testing authentication...'));
  
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/user/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': CONFIG.clientToken,
      },
      body: JSON.stringify({
        data: {
          username: CONFIG.username,
          password: CONFIG.password,
        },
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Authentication successful!'));
      console.log(chalk.gray(`   Auth token: ${data.item.auth_token.substring(0, 20)}...`));
      return data.item.auth_token;
    } else {
      console.log(chalk.red('❌ Authentication failed:'));
      console.log(chalk.red(`   Status: ${response.status}`));
      console.log(chalk.red(`   Message: ${data.message || 'Unknown error'}`));
      console.log(chalk.red(`   Code: ${data.message_code || 'N/A'}`));
      return null;
    }
  } catch (error) {
    console.log(chalk.red('❌ Network error during authentication:'));
    console.log(chalk.red(`   ${error.message}`));
    return null;
  }
}

// Test attorney list retrieval
async function testAttorneyList(authToken) {
  console.log(chalk.blue('👨‍💼 Testing attorney list retrieval...'));
  
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/firm/attorneys`, {
      method: 'GET',
      headers: {
        'authtoken': authToken,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Attorney list retrieved successfully!'));
      console.log(chalk.gray(`   Found ${data.count} attorney(s)`));
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((attorney, index) => {
          console.log(chalk.gray(`   ${index + 1}. ${attorney.display_name} (ID: ${attorney.id})`));
        });
      }
      return true;
    } else {
      console.log(chalk.yellow('⚠️  Attorney list retrieval failed:'));
      console.log(chalk.yellow(`   Status: ${response.status}`));
      console.log(chalk.yellow(`   Message: ${data.message || 'Unknown error'}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Network error retrieving attorney list:'));
    console.log(chalk.yellow(`   ${error.message}`));
    return false;
  }
}

// Test payment accounts retrieval
async function testPaymentAccounts(authToken) {
  console.log(chalk.blue('💳 Testing payment accounts retrieval...'));
  
  try {
    const response = await fetch(`${CONFIG.baseURL}/il/payment_accounts`, {
      method: 'GET',
      headers: {
        'authtoken': authToken,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Payment accounts retrieved successfully!'));
      console.log(chalk.gray(`   Found ${data.count} account(s)`));
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((account, index) => {
          console.log(chalk.gray(`   ${index + 1}. ${account.name} (ID: ${account.id})`));
        });
      }
      return true;
    } else {
      console.log(chalk.yellow('⚠️  Payment accounts retrieval failed:'));
      console.log(chalk.yellow(`   Status: ${response.status}`));
      console.log(chalk.yellow(`   Message: ${data.message || 'Unknown error'}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Network error retrieving payment accounts:'));
    console.log(chalk.yellow(`   ${error.message}`));
    return false;
  }
}

// Main verification function
async function main() {
  try {
    // Check environment variables
    checkEnvironmentVariables();
    
    // Test authentication
    const authToken = await testAuthentication();
    if (!authToken) {
      console.log(chalk.red('\n❌ Credential verification failed'));
      console.log(chalk.yellow('Please contact Tyler Technologies to verify your credentials\n'));
      process.exit(1);
    }
    
    // Test additional endpoints
    const attorneySuccess = await testAttorneyList(authToken);
    const paymentSuccess = await testPaymentAccounts(authToken);
    
    // Summary
    console.log(chalk.blue('\n📊 Verification Summary:'));
    console.log(chalk.green('✅ Authentication: SUCCESS'));
    console.log(attorneySuccess ? chalk.green('✅ Attorney List: SUCCESS') : chalk.yellow('⚠️  Attorney List: FAILED'));
    console.log(paymentSuccess ? chalk.green('✅ Payment Accounts: SUCCESS') : chalk.yellow('⚠️  Payment Accounts: FAILED'));
    
    if (attorneySuccess && paymentSuccess) {
      console.log(chalk.green('\n🎉 All Tyler Technologies API endpoints verified!'));
      console.log(chalk.green('✅ Ready for production deployment\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  Some endpoints failed - e-filing may have limited functionality'));
      console.log(chalk.yellow('Contact Tyler Technologies if this persists\n'));
    }
    
  } catch (error) {
    console.log(chalk.red('\n❌ Unexpected error during verification:'));
    console.log(chalk.red(`   ${error.message}\n`));
    process.exit(1);
  }
}

// Run the verification
main();