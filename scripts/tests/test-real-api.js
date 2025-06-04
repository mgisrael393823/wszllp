#!/usr/bin/env node
// @ts-check

/**
 * This script runs Cypress tests against the real API
 * It loads environment variables from .env.local and passes them to Cypress
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found. Please create it with your API credentials.');
  process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

// Check for required variables
const requiredVars = [
  'VITE_EFILE_BASE_URL',
  'VITE_EFILE_CLIENT_TOKEN',
  'VITE_EFILE_USERNAME',
  'VITE_EFILE_PASSWORD'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Set environment flag to include credentials
process.env.CYPRESS_INCLUDE_CREDENTIALS = '1';

// Run Cypress with real API tests
console.log('Running Cypress tests against real API...');
console.log(`Using API URL: ${process.env.VITE_EFILE_BASE_URL}`);
console.log(`Using username: ${process.env.VITE_EFILE_USERNAME}`);

// Command to run specific real API tests
const cypressArgs = ['run', '--spec', 'cypress/e2e/efile-real-api.cy.js'];

// Spawn Cypress process
const cypressProcess = spawn('npx', ['cypress', ...cypressArgs], {
  stdio: 'inherit',
  env: process.env
});

// Handle process exit
cypressProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Cypress tests failed with exit code ${code}`);
    process.exit(code);
  }
  console.log('Cypress tests completed successfully');
});