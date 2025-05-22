/// <reference types="cypress" />

// Smoke test covering the happy path of the e-filing workflow
// Stubs API calls and verifies the UI updates as expected.

describe('E-Filing Smoke Test', () => {
  beforeEach(() => {
    // Ensure a clean localStorage for each run
    cy.clearLocalStorage();

    // Stub authentication endpoint and provide a mock token
    cy.intercept('POST', '**/v4/il/user/authenticate', {
      statusCode: 200,
      body: {
        auth_token: 'mock-auth-token-1234567890',
        expires_in: 3600,
      },
    }).as('authenticate');

    // Stub e-file submission request
    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          status: 'submitting',
        },
      },
    }).as('submitFiling');

    // First status poll returns "submitting"
    cy.intercept('GET', '**/v4/il/envelope/env-12345', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          filings: [{ status: 'submitting' }],
        },
      },
    }).as('statusSubmitting');

    // Fail fast on unexpected 404s for API requests
    cy.intercept('**/v4/il/**', req => {
      req.on('after:response', res => {
        if (res.statusCode === 404) {
          throw new Error(`Unexpected 404 for ${req.method} ${req.url}`);
        }
      });
    });

    // Capture console errors so we can print them if the test fails
    cy.on('window:before:load', win => {
      cy.stub(win.console, 'error').as('consoleError');
    });

    // Bypass authentication flow with a stored token
    cy.mockEfileToken();

    // Visit the e-filing page. If the page itself 404s, the test will fail.
    cy.visit('/efile', { failOnStatusCode: true });
  });

  afterEach(function () {
    // When a test fails, dump useful debugging info
    if (this.currentTest?.state === 'failed') {
      cy.document().then(doc => {
        const html = doc.documentElement.innerHTML.substring(0, 1000);
        cy.log('Page HTML snippet:\n' + html);
      });
      cy.get('@consoleError').then(stub => {
        if (stub && stub.callCount) {
          cy.log('Console errors:');
          for (let i = 0; i < stub.callCount; i++) {
            cy.log(stub.getCall(i).args.join(' '));
          }
        }
      });
    }
  });

  it('submits a filing and displays acceptance', () => {
    // ----- Fill out basic form fields -----
    cy.get('select[name="jurisdiction"]').select('il');
    cy.get('select[name="county"]').select('cook');
    cy.get('input[name="caseNumber"]').type('2025-CV-12345');
    cy.get('input[name="attorneyId"]').type('AT98765');

    // Upload the PDF fixture
    cy.mockFileUpload('input[type="file"]', 'eviction_complaint_template.pdf');

    // Group: verify file upload UI
    cy.contains('1 file(s) selected').should('be.visible');
    cy.contains('eviction_complaint_template.pdf').should('be.visible');

    // ----- Submit the form -----
    cy.get('button[type="submit"]').click();
    cy.wait('@submitFiling');

    // Group: submission toasts and panel
    cy.contains('Filing Submitted').should('be.visible');
    cy.contains('Envelope env-12345 submitted successfully').should('be.visible');
    cy.contains('Filing Status').should('be.visible');
    cy.contains('Envelope env-12345').should('be.visible');

    // ----- First status poll -----
    cy.wait('@statusSubmitting');

    // Replace the interceptor so the next poll returns "submitted"
    cy.intercept('GET', '**/v4/il/envelope/env-12345', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          filings: [
            {
              status: 'submitted',
              stamped_document: 'https://example.com/stamped-doc.pdf',
            },
          ],
        },
      },
    }).as('statusSubmitted');

    // Trigger another status check
    cy.get('button:contains("Check Status")').click({ force: true });
    cy.wait('@statusSubmitted');

    // Group: accepted status assertions
    cy.contains('Filing Accepted').should('be.visible');
    cy.contains('Stamped document is available for download').should('be.visible');
    cy.contains('Download Stamped').should('be.visible');
  });
});
