// Import commands.js using ES2015 syntax:
import './commands';

// Setup environment variables before tests start
before(async () => {
  // Load production URL and other env vars
  const productionUrl = await cy.task('getEnvVariable', 'PRODUCTION_URL');
  const tylerUsername = await cy.task('getEnvVariable', 'TYLER_API_USERNAME');
  const tylerPassword = await cy.task('getEnvVariable', 'TYLER_API_PASSWORD');
  const clientToken = await cy.task('getEnvVariable', 'VITE_EFILE_CLIENT_TOKEN');
  
  if (productionUrl) {
    Cypress.env('productionUrl', productionUrl);
  }
  if (tylerUsername) {
    Cypress.env('TYLER_API_USERNAME', tylerUsername);
  }
  if (tylerPassword) {
    Cypress.env('TYLER_API_PASSWORD', tylerPassword);
  }
  if (clientToken) {
    Cypress.env('VITE_EFILE_CLIENT_TOKEN', clientToken);
  }
});

// Disable uncaught exception reporting
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});