/**
 * Enhanced Supabase Authentication Helper for Cypress
 * 
 * This module provides robust authentication methods for Cypress tests
 * with retry logic, session expiry checks, and CI/CD optimizations.
 */

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

/**
 * Authenticates with Supabase using the token endpoint with retry logic
 */
export function authenticateWithSupabaseRetry(email, password, attempt = 1) {
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
    failOnStatusCode: false,
    timeout: 30000 // 30 second timeout
  }).then((response) => {
    // Success
    if (response.status === 200) {
      return response;
    }
    
    // Network error - retry
    if (response.status >= 500 && attempt < RETRY_CONFIG.maxAttempts) {
      const delay = RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
      cy.log(`⚠️ Auth attempt ${attempt} failed with status ${response.status}. Retrying in ${delay}ms...`);
      cy.wait(delay);
      return authenticateWithSupabaseRetry(email, password, attempt + 1);
    }
    
    // Non-retryable error
    return response;
  });
}

/**
 * Checks if a session has expired
 */
export function isSessionExpired(sessionData) {
  if (!sessionData || !sessionData.expires_at) {
    return true;
  }
  
  const expiresAt = sessionData.expires_at * 1000; // Convert to milliseconds
  const now = Date.now();
  const bufferMs = 60000; // 1 minute buffer
  
  return now > (expiresAt - bufferMs);
}

/**
 * Stores the Supabase session with enhanced validation
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
    user: sessionData.user,
    // Add metadata for debugging
    _stored_at: new Date().toISOString(),
    _cypress_test: true
  };
  
  return cy.window().then((win) => {
    win.localStorage.setItem(storageKey, JSON.stringify(session));
    return { storageKey, session };
  });
}

/**
 * Complete Supabase login flow with retry logic and session management
 */
export function loginToSupabaseEnhanced() {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const useRealAuth = Cypress.env('USE_REAL_AUTH') !== 'false';
  
  // In CI environment, consider using mock sessions for speed
  if (!useRealAuth && Cypress.env('CI')) {
    cy.log('🚀 Using mock session for CI environment');
    return cy.task('createMockSession', { email }).then((mockSession) => {
      return storeSupabaseSession(mockSession, supabaseUrl).then(({ storageKey }) => {
        cy.log(`✅ Mock session stored in ${storageKey}`);
        return mockSession;
      });
    });
  }
  
  // Check for existing valid session first
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  
  return cy.window().then((win) => {
    const existingSession = win.localStorage.getItem(storageKey);
    
    if (existingSession) {
      try {
        const sessionData = JSON.parse(existingSession);
        if (!isSessionExpired(sessionData)) {
          cy.log('♻️ Using existing valid session');
          return sessionData;
        }
        cy.log('🔄 Existing session expired, re-authenticating...');
      } catch (e) {
        cy.log('⚠️ Invalid session data, re-authenticating...');
      }
    }
    
    // Perform authentication with retry
    return authenticateWithSupabaseRetry(email, password).then((response) => {
      if (response.status === 200) {
        // Success - store the session
        return storeSupabaseSession(response.body, supabaseUrl).then(({ storageKey, session }) => {
          cy.log(`✅ Supabase auth successful. Session stored in ${storageKey}`);
          cy.log(`📅 Session expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
          return response.body;
        });
      } else if (response.status === 400) {
        // Check specific error types
        const errorMsg = response.body.msg || response.body.error_description || 'Unknown error';
        
        if (errorMsg.includes('Invalid login credentials')) {
          cy.log('❌ Invalid credentials. Make sure the user exists in Supabase.');
          throw new Error('Invalid Supabase credentials. Please check TEST_USER_EMAIL and TEST_USER_PASSWORD in cypress.env.json');
        } else if (errorMsg.includes('Email not confirmed')) {
          cy.log('❌ Email not confirmed. Please confirm the email address in Supabase.');
          throw new Error('Email not confirmed. Please check your email for the confirmation link.');
        }
        
        throw new Error(`Auth failed: ${errorMsg}`);
      } else {
        // Other error
        cy.log(`❌ Auth failed with status ${response.status}:`, response.body);
        throw new Error(`Supabase auth failed: ${JSON.stringify(response.body)}`);
      }
    });
  });
}

/**
 * Verify authentication with enhanced checks
 */
export function verifyAuthenticationEnhanced() {
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  
  return cy.window().then((win) => {
    const session = win.localStorage.getItem(storageKey);
    if (!session) {
      throw new Error('No Supabase session found in localStorage');
    }
    
    let sessionData;
    try {
      sessionData = JSON.parse(session);
    } catch (e) {
      throw new Error('Invalid session data - could not parse JSON');
    }
    
    if (!sessionData.access_token) {
      throw new Error('Invalid session data - missing access_token');
    }
    
    if (isSessionExpired(sessionData)) {
      throw new Error('Session has expired');
    }
    
    cy.log('✅ Valid Supabase session found');
    cy.log(`👤 User: ${sessionData.user?.email || 'Unknown'}`);
    cy.log(`📅 Expires: ${new Date(sessionData.expires_at * 1000).toLocaleString()}`);
    
    return sessionData;
  });
}

// Export original functions for backward compatibility
export { authenticateWithSupabaseRetry as authenticateWithSupabase };
export { loginToSupabaseEnhanced as loginToSupabase };
export { verifyAuthenticationEnhanced as verifyAuthentication };
