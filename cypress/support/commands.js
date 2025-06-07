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
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  // In CI with mock credentials, use setupSupabaseSession instead
  if (!email || !password || (supabaseUrl && supabaseUrl.includes('mock'))) {
    cy.log('🔧 Using mock authentication for CI');
    return cy.setupSupabaseSession({
      email: 'test@example.com',
      id: 'test-user-ci',
    });
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  const maxAttempts = 3;

  const attemptLogin = (attempt = 1) => {
    return cy
      .request({
        method: 'POST',
        url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: {
          email,
          password,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 200) {
          cy.log('✅ Supabase auth successful');
          return cy.window().then((win) => {
            win.localStorage.setItem(
              storageKey,
              JSON.stringify({
                access_token: response.body.access_token,
                token_type: response.body.token_type || 'bearer',
                expires_in: response.body.expires_in || 3600,
                expires_at:
                  response.body.expires_at || Math.floor(Date.now() / 1000) + 3600,
                refresh_token: response.body.refresh_token,
                user: response.body.user,
              })
            );
          });
        }

        if ((response.status >= 500 || response.status === 0) && attempt < maxAttempts) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          cy.log(`⚠️ Auth attempt ${attempt} failed. Retrying in ${delay}ms`);
          return cy
            .wait(delay)
            .then(() => attemptLogin(attempt + 1));
        }

        if (response.status === 400 || response.status === 401) {
          throw new Error(`Supabase auth failed: ${JSON.stringify(response.body)}`);
        }

        throw new Error(`Supabase auth failed with status ${response.status}`);
      });
  };

  return attemptLogin();
});

// Command to setup authenticated session without API call (for faster tests)
Cypress.Commands.add('setupSupabaseSession', (userData = {}) => {
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  
  // Create a mock session
  const mockSession = {
    access_token: 'mock-access-token-' + Date.now(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: userData.id || 'test-user-id',
      email: userData.email || Cypress.env('TEST_USER_EMAIL'),
      role: 'authenticated',
      ...userData
    }
  };
  
  cy.window().then((win) => {
    win.localStorage.setItem(
      `sb-${projectRef}-auth-token`,
      JSON.stringify(mockSession)
    );
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