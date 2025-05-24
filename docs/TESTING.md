# Testing Guide

This document explains how to configure and run tests for the Legal Case Management application.

## Test Environment Setup

### Prerequisites

1. **For Unit Tests**: No special setup required - mocked by default
2. **For Integration Tests**: Requires Supabase test environment
3. **For E2E Tests**: Requires Xvfb on Linux systems

### Environment Variables

Create `.env.test` file with test environment values:

```bash
# Test/Staging Supabase (not production!)
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_KEY=your-test-service-key

# Mock values for unit tests
VITE_EFILE_BASE_URL=https://mock-api.example.com/v4
VITE_EFILE_CLIENT_TOKEN=mock-token
VITE_EFILE_USERNAME=mock-user
VITE_EFILE_PASSWORD=mock-pass
```

## Running Tests

### Unit Tests (Fast, Mocked)
```bash
npm run test:unit
npm run test:unit:watch  # Watch mode
```

### Integration Tests (Requires Real Supabase)
```bash
npm run test:integration
```

### End-to-End Tests

**Local Development:**
```bash
npm run cy:open          # Interactive mode
npm run test:e2e         # Headless mode
npm run test:e2e:headless # With Xvfb (Linux)
```

**CI Environment:**
- Automatically runs with Xvfb installed
- Uses mock Supabase values
- Excludes real API tests

### All Tests
```bash
npm test  # Runs unit + e2e tests
```

## Test Configuration

### Unit Tests
- **File**: `vitest.config.ts`
- **Environment**: jsdom with mocked dependencies
- **Includes**: `tests/**/*.{test,spec}.{js,ts,jsx,tsx}`
- **Excludes**: Integration tests, Cypress tests

### Integration Tests
- **File**: `vitest.integration.config.ts` 
- **Environment**: Real Supabase connection required
- **Includes**: `tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}`
- **Timeout**: 30 seconds for database operations

### E2E Tests
- **File**: `cypress.config.js`
- **Environment**: Full application with real browser
- **BaseURL**: `http://localhost:5173`
- **Excludes**: Real API tests in CI (unless `CYPRESS_INCLUDE_CREDENTIALS=1`)

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.test` exists with valid values
- For unit tests: Values can be mocks
- For integration tests: Must be real test environment

### "Missing Xvfb" (Linux E2E)
```bash
sudo apt-get update
sudo apt-get install -y xvfb
```

### "Cypress baseUrl not accessible"
- Ensure dev server is running: `npm run dev`
- Or use preview mode: `npm run build && npm run preview`

### "Tests timeout" 
- Integration tests: Increase timeout in config
- E2E tests: Check if dev server is responsive
- Network issues: Use local/staging environment

## CI/CD Integration

The `.github/workflows/ci.yml` automatically:
1. Runs unit tests with mocked dependencies
2. Installs Xvfb for headless E2E testing
3. Uses mock environment variables
4. Uploads test artifacts on failure

## Best Practices

1. **Unit Tests**: Mock all external dependencies
2. **Integration Tests**: Use dedicated test database
3. **E2E Tests**: Test user workflows, not implementation details
4. **Environment Separation**: Never use production data in tests
5. **Fast Feedback**: Keep unit tests fast, integration tests focused

## Adding New Tests

### Unit Test Example
```typescript
// tests/unit/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Test Example  
```typescript
// tests/integration/api/documents.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabaseClient';

describe('Documents API', () => {
  it('should create document', async () => {
    const { data, error } = await supabase
      .from('documents')
      .insert({ type: 'Test', case_id: 'test-case' });
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### E2E Test Example
```javascript
// cypress/e2e/documents.cy.js
describe('Documents Page', () => {
  it('should upload document', () => {
    cy.visit('/documents');
    cy.get('[data-cy=upload-btn]').click();
    cy.get('[data-cy=file-input]').selectFile('test-file.pdf');
    cy.get('[data-cy=submit-btn]').click();
    cy.contains('Document uploaded successfully');
  });
});
```