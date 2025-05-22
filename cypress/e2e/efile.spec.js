/// <reference types="cypress" />

describe('E-Filing End-to-End Test', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('POST', '**/v4/il/user/authenticate', {
      statusCode: 200,
      body: {
        auth_token: 'mock-auth-token-1234567890',
        expires_in: 3600
      }
    }).as('authenticate');

    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          status: 'submitting'
        }
      }
    }).as('submitFiling');

    // Mock first status check - still submitting
    cy.intercept('GET', '**/v4/il/envelope/env-12345', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          filings: [
            {
              status: 'submitting'
            }
          ]
        }
      }
    }).as('checkStatusSubmitting');

    // Set up route for second status check - now submitted
    cy.intercept('GET', '**/v4/il/envelope/env-12345', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          filings: [
            {
              status: 'submitted',
              stamped_document: 'https://example.com/stamped-doc.pdf'
            }
          ]
        }
      }
    }).as('checkStatusSubmitted');

    // Mock authentication token to bypass auth flow
    cy.mockEfileToken();
    
    // Visit the e-filing page
    cy.visit('/efile');
  });

  it('should complete the entire e-filing process', () => {
    // Fill out the e-filing form
    cy.get('select[name="jurisdiction"]').select('il');
    cy.get('select[name="county"]').select('cook');
    cy.get('input[name="caseNumber"]').type('2025-CV-12345');
    cy.get('input[name="attorneyId"]').type('AT98765');
    
    // Upload a sample PDF file
    cy.fixture('eviction_complaint_template.pdf', 'base64').then(fileContent => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
      const file = new File([blob], 'eviction_complaint_template.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      cy.get('input[type="file"]').then(input => {
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    
    // Verify the file was selected
    cy.contains('1 file(s) selected').should('be.visible');
    cy.contains('eviction_complaint_template.pdf').should('be.visible');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for submission to complete
    cy.wait('@submitFiling');
    
    // Check for success message
    cy.contains('Filing Submitted').should('be.visible');
    cy.contains('Envelope env-12345 submitted successfully').should('be.visible');
    
    // Check status panel shows the envelope
    cy.contains('Filing Status').should('be.visible');
    cy.contains('Envelope env-12345').should('be.visible');
    
    // First status check - still submitting
    cy.wait('@checkStatusSubmitting');
    
    // Overwrite the interceptor for the next status check
    cy.intercept('GET', '**/v4/il/envelope/env-12345', {
      statusCode: 200,
      body: {
        item: {
          id: 'env-12345',
          filings: [
            {
              status: 'submitted',
              stamped_document: 'https://example.com/stamped-doc.pdf'
            }
          ]
        }
      }
    }).as('checkStatusSubmitted');
    
    // Force the status check
    cy.wait(1000);
    cy.get('button:contains("Check Status")').click({force: true});
    
    // Wait for the status check and verify status change
    cy.wait('@checkStatusSubmitted');
    
    // Verify success toast and status update
    cy.contains('Filing Accepted').should('be.visible');
    cy.contains('Stamped document is available for download').should('be.visible');
    
    // Check that the status panel shows the download link
    cy.contains('Download Stamped').should('be.visible');
  });
});