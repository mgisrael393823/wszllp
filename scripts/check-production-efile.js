#!/usr/bin/env node

/**
 * Check production e-filing status
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

console.log(chalk.blue('🔍 Checking Production E-Filing Status\n'));

async function checkProductionSite() {
  console.log('1️⃣ Checking production website...');
  
  try {
    const response = await fetch('https://www.wszevictions.com');
    console.log(chalk.green(`✅ Website is up (Status: ${response.status})`));
  } catch (error) {
    console.log(chalk.red('❌ Website is down:', error.message));
  }
}

async function checkTylerAPI() {
  console.log('\n2️⃣ Testing Tyler API authentication...');
  
  try {
    const response = await fetch('https://api.uslegalpro.com/v4/il/user/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': 'EVICT87'
      },
      body: JSON.stringify({
        data: {
          username: 'czivin@wolfsolovy.com',
          password: 'Zuj90820*'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Tyler API authentication working'));
      console.log(chalk.gray(`   Auth token received: ${data.item.auth_token.substring(0, 30)}...`));
      
      // Test attorney list with the token
      await testAttorneyList(data.item.auth_token);
    } else {
      console.log(chalk.red('❌ Tyler API authentication failed'));
      console.log(chalk.red(`   Status: ${response.status}`));
      console.log(chalk.red(`   Message: ${data.message || 'Unknown error'}`));
    }
  } catch (error) {
    console.log(chalk.red('❌ Tyler API error:'), error.message);
  }
}

async function testAttorneyList(authToken) {
  console.log('\n3️⃣ Testing attorney list retrieval...');
  
  try {
    const response = await fetch('https://api.uslegalpro.com/v4/il/firm/attorneys', {
      method: 'GET',
      headers: {
        'authtoken': authToken
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.message_code === 0) {
      console.log(chalk.green('✅ Attorney list retrieved successfully'));
      console.log(chalk.gray(`   Found ${data.count} attorneys`));
    } else {
      console.log(chalk.red('❌ Attorney list retrieval failed'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Attorney list error:'), error.message);
  }
}

async function checkProductionConfig() {
  console.log('\n4️⃣ Production Configuration Summary:');
  console.log('   Base URL: https://api.uslegalpro.com/v4');
  console.log('   Client Token: EVICT87');
  console.log('   Environment: Production');
  
  console.log('\n5️⃣ Latest Deployment:');
  console.log('   URL: https://www.wszevictions.com');
  console.log('   Time: Just deployed');
  console.log('   Fix Applied: Removed newline characters from env vars');
}

// Run all checks
async function main() {
  await checkProductionSite();
  await checkTylerAPI();
  await checkProductionConfig();
  
  console.log(chalk.blue('\n✨ Production check complete'));
  console.log(chalk.yellow('\n💡 To verify in browser:'));
  console.log('   1. Visit https://www.wszevictions.com');
  console.log('   2. Log in to your account');
  console.log('   3. Navigate to Documents → eFiling');
  console.log('   4. Check browser console for any errors');
  console.log('   5. Try the "Authenticate" button');
}

main().catch(console.error);