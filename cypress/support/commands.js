// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Mock authentication tokens
Cypress.Commands.add('mockEfileToken', () => {
  // Mock auth token in localStorage
  localStorage.setItem('efile_auth_token', JSON.stringify({
    token: 'mock-auth-token-1234567890',
    expires: Date.now() + 3600000, // 1 hour from now
  }));
});

// Perform real Supabase login using environment credentials
Cypress.Commands.add('loginSupabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SUPABASE_URL')}/auth/v1/token`,
    headers: {
      apikey: Cypress.env('SUPABASE_ANON_KEY'),
      'Content-Type': 'application/json',
    },
    body: {
      grant_type: 'password',
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD'),
    },
  }).then(({ body }) => {
    const projectRef = new URL(Cypress.env('SUPABASE_URL')).hostname.split('.')[0];
    window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(body));
  });
});

// Mock a file upload by setting the files property
Cypress.Commands.add('mockFileUpload', (selector, fixture) => {
  cy.fixture(fixture, 'base64').then(fileContent => {
    cy.get(selector).then(input => {
      // Convert the base64 string to a Blob
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
      const file = new File([blob], fixture, { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input[0].files = dataTransfer.files;
      input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
});