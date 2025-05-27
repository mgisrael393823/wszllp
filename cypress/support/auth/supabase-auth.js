/**
 * Supabase Authentication Helper for Cypress
 * 
 * This module provides robust authentication methods for Cypress tests
 * to work with Supabase Auth.
 */

/**
 * Authenticates with Supabase using the token endpoint
 * This is the most reliable method for existing users
 */
export function authenticateWithSupabase(email, password) {
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');
  
  return cy.request({
    method: 'POST',
    url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
    headers: {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: {
      email: email,
      password: password,
    },
    failOnStatusCode: false
  });
}

/**
 * Stores the Supabase session in localStorage
 * in the format expected by the Supabase client
 */
export function storeSupabaseSession(sessionData, supabaseUrl) {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  
  const session = {
    access_token: sessionData.access_token,
    token_type: sessionData.token_type || 'bearer',
    expires_in: sessionData.expires_in || 3600,
    expires_at: sessionData.expires_at || Math.floor(Date.now() / 1000) + 3600,
    refresh_token: sessionData.refresh_token,
    user: sessionData.user
  };
  
  return cy.window().then((win) => {
    win.localStorage.setItem(storageKey, JSON.stringify(session));
    return storageKey;
  });
}

/**
 * Complete Supabase login flow with error handling
 */
export function loginToSupabase() {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  
  return authenticateWithSupabase(email, password).then((response) => {
    if (response.status === 200) {
      // Success - store the session
      return storeSupabaseSession(response.body, supabaseUrl).then((storageKey) => {
        cy.log(`✅ Supabase auth successful. Session stored in ${storageKey}`);
        return response.body;
      });
    } else if (response.status === 400 && response.body.msg === 'Invalid login credentials') {
      // User doesn't exist or wrong password
      cy.log('❌ Invalid credentials. Make sure the user exists in Supabase.');
      throw new Error('Invalid Supabase credentials. Please check TEST_USER_EMAIL and TEST_USER_PASSWORD in cypress.env.json');
    } else {
      // Other error
      cy.log(`❌ Auth failed with status ${response.status}:`, response.body);
      throw new Error(`Supabase auth failed: ${JSON.stringify(response.body)}`);
    }
  });
}

/**
 * Verify that the user is authenticated by checking the session
 */
export function verifyAuthentication() {
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  
  return cy.window().then((win) => {
    const session = win.localStorage.getItem(storageKey);
    if (!session) {
      throw new Error('No Supabase session found in localStorage');
    }
    
    const sessionData = JSON.parse(session);
    if (!sessionData.access_token) {
      throw new Error('Invalid session data - missing access_token');
    }
    
    cy.log('✅ Valid Supabase session found');
    return sessionData;
  });
}
