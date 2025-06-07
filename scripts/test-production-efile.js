#!/usr/bin/env node

/**
 * Test production e-filing functionality
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';

const PRODUCTION_URL = 'https://www.wszevictions.com';

async function testEfilingPage() {
  console.log(chalk.blue('🔍 Testing Production E-Filing Page\n'));
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up console log capture
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('E-File') || text.includes('Tyler') || text.includes('error')) {
        consoleLogs.push({
          type: msg.type(),
          text: text
        });
      }
    });
    
    // Capture network errors
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok() && response.url().includes('api.uslegalpro.com')) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    console.log(chalk.gray('1️⃣ Navigating to e-filing page...'));
    
    // First, we need to log in
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Log in with test credentials (you'll need to provide these)
    console.log(chalk.gray('2️⃣ Logging in...'));
    // Note: You'll need to add actual login credentials here
    
    // Navigate to e-filing page
    await page.goto(`${PRODUCTION_URL}/dashboard/documents/efile`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log(chalk.gray('3️⃣ Checking for errors...'));
    
    // Wait a bit for any async operations
    await page.waitForTimeout(5000);
    
    // Check results
    console.log('\n📊 Test Results:');
    
    if (networkErrors.length === 0) {
      console.log(chalk.green('✅ No Tyler API errors detected'));
    } else {
      console.log(chalk.red(`❌ Found ${networkErrors.length} Tyler API error(s):`));
      networkErrors.forEach(error => {
        console.log(chalk.red(`   ${error.status} ${error.statusText} - ${error.url}`));
      });
    }
    
    // Check console logs
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    if (errorLogs.length === 0) {
      console.log(chalk.green('✅ No console errors'));
    } else {
      console.log(chalk.red(`❌ Found ${errorLogs.length} console error(s):`));
      errorLogs.forEach(log => {
        console.log(chalk.red(`   ${log.text}`));
      });
    }
    
    // Check for authentication logs
    const authLogs = consoleLogs.filter(log => log.text.includes('Authentication successful'));
    if (authLogs.length > 0) {
      console.log(chalk.green('✅ Authentication successful'));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message);
  } finally {
    await browser.close();
  }
}

// Alternative: Test via direct API call from browser context
async function testDirectAPI() {
  console.log(chalk.blue('\n🔍 Testing Direct API Call\n'));
  
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
      console.log(chalk.green('✅ Direct API authentication successful'));
      console.log(chalk.gray(`   Token: ${data.item.auth_token.substring(0, 20)}...`));
    } else {
      console.log(chalk.red('❌ Direct API authentication failed'));
      console.log(chalk.red(`   Status: ${response.status}`));
      console.log(chalk.red(`   Message: ${data.message}`));
    }
  } catch (error) {
    console.log(chalk.red('❌ Direct API test failed:'), error.message);
  }
}

// Run tests
async function main() {
  // First test direct API
  await testDirectAPI();
  
  // Then test via browser
  // await testEfilingPage();
  
  console.log(chalk.blue('\n✨ Test complete'));
}

main().catch(console.error);