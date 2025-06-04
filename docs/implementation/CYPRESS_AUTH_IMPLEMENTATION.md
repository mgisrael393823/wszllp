# Supabase Authentication for Cypress Tests - Implementation Guide

## ✅ Changes Summary

### Fixed Issues:
1. **Corrected auth endpoint format**: `/auth/v1/token?grant_type=password`
2. **Already had proper async handling**: Code structure was correct
3. **Enhanced with retry logic**: 3 attempts with exponential backoff
4. **Added session expiry checks**: Prevents using expired tokens
5. **CI/CD optimizations**: Mock session support for faster tests

### New Features:
- **Retry Logic**: Automatically retries on network errors (500+ status codes)
- **Session Caching**: Reuses valid sessions to reduce API calls
- **Enhanced Error Messages**: Clear, actionable error descriptions
- **CI Mode**: Use mock sessions with `USE_REAL_AUTH=false`
- **Session Metadata**: Tracks when sessions were stored and expiry times

## 🚀 Usage

### Standard Usage (Real Authentication):
```javascript
// In your test file
beforeEach(() => {
  cy.clearLocalStorage();
  cy.loginSupabase(); // Uses enhanced auth with retry logic
  cy.visit('/');
});
```

### CI/CD Usage (Mock Sessions):
```bash
# In your CI environment variables
export CI=true
export USE_REAL_AUTH=false

# Run tests
npm run cypress:run
```

### Local Development:
```bash
# Run with real auth (default)
npm run cypress:run

# Run with mock sessions (faster)
USE_REAL_AUTH=false npm run cypress:run
```

## 🔍 Debugging

### Check Authentication:
```javascript
// In your test
cy.loginSupabase().then(() => {
  cy.verifyAuthentication(); // Logs session details
});
```

### Test Auth Manually:
```bash
# Run the debug script
node cypress/support/auth/test-supabase-auth.js
```

## 📊 Session Details

The enhanced auth system provides detailed logging:
- ✅ Successful authentication
- 📅 Session expiry time
- 👤 Authenticated user email
- ♻️ When existing sessions are reused
- 🔄 When sessions are refreshed
- ⚠️ Clear error messages

## 🎯 Next Steps

Your e-filing compliance tests should now run successfully with:
```bash
npm run test:efile
# or
npm run cypress:run -- --spec "cypress/e2e/efile.cy.ts"
```

The tests will validate:
- Initial filing flow (new cases)
- Subsequent filing flow (existing cases)
- Cross-reference handling
- Conditional form fields
- API payload structure
