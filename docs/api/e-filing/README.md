# E-Filing API Documentation

This directory contains documentation for the e-filing integration API and related resources.

## Documentation Files

- [`OFFICIAL-API-DOCUMENTATION-WITH-CREDENTIALS.txt`](./OFFICIAL-API-DOCUMENTATION-WITH-CREDENTIALS.txt) - Original API documentation from the provider with client token and stage credentials
- [`API-INTEGRATION-GUIDE.md`](./API-INTEGRATION-GUIDE.md) - Structured documentation of API endpoints, authentication flow, and data formats
- [`IMPLEMENTATION-STRATEGY.md`](./IMPLEMENTATION-STRATEGY.md) - Technical implementation plan with component architecture, roadmap, and technical requirements

## Integration Plan

The e-filing integration will allow the WSZLLP application to directly submit court filings electronically, which aligns with PRD section 6.3 Integration requirements.

## Sample Documents

The [`/samples`](./samples/) folder contains template documents that will be used for e-filing submissions:

- [`eviction_complaint_template.pdf`](./samples/eviction_complaint_template.pdf) - Standard eviction complaint template that will be filled with case-specific information before submission
- [`eviction_summons_template.pdf`](./samples/eviction_summons_template.pdf) - Standard eviction summons template that will be filled with defendant information before submission

These templates represent the base documents that will be consistently uploaded as part of the e-filing process. In real-world implementations, these templates will be populated with the necessary case data, plaintiff/defendant information, and specific eviction details before submission.

The implementation will need to either:
1. Generate completed PDFs from these templates with form field data, or
2. Submit these templates along with the required JSON data for the court system to merge

## Implementation Files

Implementation files can be found in:
- `/src/components/e-filing/` - Frontend components for e-filing
- `/src/utils/e-filing/` - Utility functions for e-filing integration
- `/src/mocks/fixtures/e-filing/` - Mock data for development and testing

## Implementation Phases

As outlined in the implementation strategy document:

1. **Phase 1 – Foundation**
   - Authentication and token management
   - Core utility functions
   - Base component structure

2. **Phase 2 – Submission & Status Tracking**
   - Form integration with case selection
   - API integration with React Query
   - Status tracking and notifications

3. **Phase 3 – Refinement**
   - Error handling with enhanced retry logic:
     - Robust try/catch semantics to prevent unhandled promise rejections
     - Proper handling of callback errors and timer-related promises
     - Improved error capture and propagation
   - Audit logging
   - Permission controls
   - Testing
   - Offline draft support
   - Toast notifications

## Testing & QA

### Running End-to-End Tests

Our e-filing implementation includes comprehensive end-to-end tests using Cypress:

```bash
# Open Cypress interactive runner
npm run cy:open

# Run all tests headlessly
npm run test:e2e

# Run just e-filing tests
npx cypress run --spec "cypress/e2e/efile*.spec.js"
```

### Manual Smoke Testing

To manually test the e-filing functionality:

1. Configure environment variables:
   ```bash
   # Add to .env.local
   VITE_EFILE_BASE_URL=https://stage-api.courts.example.com
   VITE_EFILE_CLIENT_TOKEN=your_client_token
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to the E-Filing page at `/efile`

4. Use the sample documents in `/docs/api/e-filing/samples/`:
   - `eviction_complaint_template.pdf`
   - `eviction_summons_template.pdf`

5. Complete and submit the form with test data:
   - Jurisdiction: Illinois
   - County: Cook County
   - Case Number: Any format (e.g., 2025-CV-12345)
   - Attorney ID: Any format (e.g., AT12345)
   - Upload at least one of the sample PDFs

6. Verify you receive an envelope ID and see "Submitted" in the status panel
   - Status should automatically update when polling completes
   - A success toast notification should appear when the filing is accepted
   - If available, a stamped document link should appear for download

### Offline Support Testing

To test offline draft functionality:

1. Complete part of the form and upload a document
2. Use browser developer tools to simulate offline status
3. Refresh the page
4. Verify that a toast notification appears offering to restore the draft
5. Verify that older drafts (>7 days) are automatically purged

### Error Handling Testing

To test error handling:

1. Configure an invalid API endpoint or token
2. Submit a filing and verify appropriate error messages appear
3. Check that exponential backoff retry mechanism works by monitoring network requests:
   - The retry utility now features robust try/catch semantics to prevent unhandled rejections
   - Test with network interruptions to verify proper retry behavior
   - Verify that callbacks and timers are properly handled without dangling promises
4. Verify that fatal errors (server errors, permission errors) display clear toast notifications
5. Check that retryable operations properly distinguish between retryable and non-retryable errors

### Testing authentication

Use the Node script `scripts/test-auth.js` to verify your credentials.

1. Create a `.env.local` file in the project root with:

   ```
   VITE_EFILE_BASE_URL=https://api.uslegalpro.com/v4
   VITE_EFILE_CLIENT_TOKEN=<YOUR_CLIENT_TOKEN>
   VITE_EFILE_USERNAME=<YOUR_USERNAME>
   VITE_EFILE_PASSWORD=<YOUR_PASSWORD>
   ```

2. Restart Vite to load the new variables:

   ```bash
   npm run dev
   ```

3. Run the authentication test:

   ```bash
   npm run test:auth
   ```

4. Open your browser's DevTools Network tab and look for the
   `POST /v4/il/user/authenticate` request. Verify the clienttoken header,
   request payload and response token.
