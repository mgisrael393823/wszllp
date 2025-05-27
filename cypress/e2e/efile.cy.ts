describe('E-Filing Flows', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '**/v4/il/user/authenticate', {
      statusCode: 200,
      body: {
        message_code: 0,
        item: { auth_token: 'mock-auth-token-12345' }
      }
    }).as('authenticate');

    // Mock payment accounts
    cy.intercept('GET', '**/v4/il/payment_accounts', {
      statusCode: 200,
      body: {
        message_code: 0,
        items: [{ id: 'mock-payment-id', name: 'Test Credit Card' }],
        count: 1
      }
    }).as('paymentAccounts');

    // Mock attorneys
    cy.intercept('GET', '**/v4/il/firm/attorneys', {
      statusCode: 200,
      body: {
        message_code: 0,
        items: [{ id: 'mock-attorney-id', display_name: 'John Doe - 1234567' }],
        count: 1
      }
    }).as('attorneys');
  });

  it('should complete initial filing flow with correct payload structure', () => {
    // Intercept the e-filing submission
    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        message_code: 0,
        item: {
          id: 'envelope-12345',
          case_number: 'IL-2025-CV-001234',
          case_tracking_id: 'track-12345',
          filings: [
            {
              code: 'document',
              id: 'filing-67890',
              status: 'submitted'
            }
          ]
        }
      }
    }).as('submitInitialFiling');

    // Visit e-filing page
    cy.visit('/efile');

    // Fill out the form for initial filing
    cy.get('select[name="jurisdiction"]').select('il');
    cy.get('select[name="county"]').select('cook');
    cy.get('select[name="filingType"]').select('initial');
    cy.get('select[name="caseType"]').select('174140'); // Eviction - Residential
    
    // Create and attach a dummy PDF file
    const fileName = 'test-complaint.pdf';
    cy.fixture('eviction_complaint_template.pdf', 'base64').then(fileContent => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      cy.get('input[type="file"]').then(input => {
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Fill attorney ID
    cy.get('input[name="attorneyId"]').type('mock-attorney-id');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert the payload structure for initial filing
    cy.wait('@submitInitialFiling').then((interception) => {
      const payload = interception.request.body.data;
      
      // Should contain required fields
      expect(payload).to.have.property('reference_id');
      expect(payload).to.have.property('jurisdiction', 'cook:cvd1');
      expect(payload).to.have.property('case_category', '7');
      expect(payload).to.have.property('case_type', '174140');
      expect(payload).to.have.property('filings').that.is.an('array');
      expect(payload).to.have.property('payment_account_id');
      expect(payload).to.have.property('filing_attorney_id', 'mock-attorney-id');
      expect(payload).to.have.property('filing_party_id');
      expect(payload).to.have.property('is_initial_filing', true);
      
      // Should NOT contain case_number or cross_references for initial filing
      expect(payload).to.not.have.property('case_number');
      expect(payload).to.not.have.property('cross_references');
      
      // Verify filings structure
      expect(payload.filings[0]).to.have.property('file_name', fileName);
      expect(payload.filings[0]).to.have.property('file').that.includes('base64://');
    });

    // Verify success UI displays the returned case number
    cy.contains('Envelope envelope-12345 submitted successfully').should('be.visible');
    cy.contains('IL-2025-CV-001234').should('be.visible');
  });

  it('should complete subsequent filing flow with cross_references', () => {
    // Intercept the e-filing submission for subsequent filing
    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        message_code: 0,
        item: {
          id: 'envelope-67890',
          case_number: 'ABC123',
          case_tracking_id: 'track-67890',
          filings: [
            {
              code: 'document',
              id: 'filing-54321',
              status: 'submitted'
            }
          ]
        }
      }
    }).as('submitSubsequentFiling');

    // Visit e-filing page
    cy.visit('/efile');

    // Fill out the form for subsequent filing
    cy.get('select[name="jurisdiction"]').select('il');
    cy.get('select[name="county"]').select('cook');
    cy.get('select[name="filingType"]').select('subsequent');
    cy.get('select[name="caseType"]').select('174140'); // Eviction - Residential
    
    // The existing case number input should now be visible
    cy.get('input[name="existingCaseNumber"]').should('be.visible');
    cy.get('input[name="existingCaseNumber"]').type('ABC123');
    
    // Create and attach a dummy PDF file
    const fileName = 'test-motion.pdf';
    cy.fixture('eviction_complaint_template.pdf', 'base64').then(fileContent => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      cy.get('input[type="file"]').then(input => {
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Fill attorney ID
    cy.get('input[name="attorneyId"]').type('mock-attorney-id');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert the payload structure for subsequent filing
    cy.wait('@submitSubsequentFiling').then((interception) => {
      const payload = interception.request.body.data;
      
      // Should contain required fields
      expect(payload).to.have.property('reference_id');
      expect(payload).to.have.property('jurisdiction', 'cook:cvd1');
      expect(payload).to.have.property('case_category', '7');
      expect(payload).to.have.property('case_type', '174140');
      expect(payload).to.have.property('filings').that.is.an('array');
      expect(payload).to.have.property('payment_account_id');
      expect(payload).to.have.property('filing_attorney_id', 'mock-attorney-id');
      expect(payload).to.have.property('filing_party_id');
      expect(payload).to.have.property('is_initial_filing', false);
      
      // Should contain cross_references for subsequent filing
      expect(payload).to.have.property('cross_references').that.is.an('array');
      expect(payload.cross_references[0]).to.deep.equal({
        type: 'CASE_NUMBER',
        number: 'ABC123'
      });
      
      // Should NOT contain top-level case_number
      expect(payload).to.not.have.property('case_number');
      
      // Verify filings structure
      expect(payload.filings[0]).to.have.property('file_name', fileName);
      expect(payload.filings[0]).to.have.property('file').that.includes('base64://');
    });

    // Verify success UI or navigation
    cy.contains('Envelope envelope-67890 submitted successfully').should('be.visible');
  });

  it('should conditionally show/hide existing case number input based on filing type', () => {
    cy.visit('/efile');

    // Initially set to "initial" - should not show existing case number input
    cy.get('select[name="filingType"]').select('initial');
    cy.get('input[name="existingCaseNumber"]').should('not.exist');

    // Change to "subsequent" - should show existing case number input
    cy.get('select[name="filingType"]').select('subsequent');
    cy.get('input[name="existingCaseNumber"]').should('be.visible');
    cy.get('input[name="existingCaseNumber"]').should('have.attr', 'required');

    // Change back to "initial" - should hide again
    cy.get('select[name="filingType"]').select('initial');
    cy.get('input[name="existingCaseNumber"]').should('not.exist');
  });
});