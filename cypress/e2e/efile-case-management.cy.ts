describe('E-Filing Case Management Integration', () => {
  let mockCaseId: string;
  let mockDocumentId: string;

  beforeEach(() => {
    mockCaseId = 'case-uuid-' + Date.now();
    mockDocumentId = 'doc-uuid-' + Date.now();

    // Login to Supabase
    cy.loginSupabase();
    
    // Mock Tyler API response with successful e-filing
    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        message_code: 0,
        item: {
          id: 'envelope-123-test',
          case_tracking_id: 'tracking-456',
          case_number: 'CASE-789',
          submission_date: '2025-05-28T12:00:00Z',
          filings: [
            {
              id: 'filing-001',
              code: 'document',
              status: 'submitted',
              reviewer_comment: null
            }
          ]
        }
      }
    }).as('submitEfile');

    // Mock case creation API
    cy.intercept('POST', '/api/cases', {
      statusCode: 201,
      body: {
        success: true,
        caseId: mockCaseId,
        message: 'Case created successfully'
      }
    }).as('createCase');

    // Mock document creation API
    cy.intercept('POST', '/api/documents', {
      statusCode: 201,
      body: {
        success: true,
        documentId: mockDocumentId,
        message: 'Document created successfully'
      }
    }).as('createDocument');

    // Visit e-filing page
    cy.visit('/documents/efile');
    
    // Wait for form to load
    cy.get('[data-cy=efile-form]', { timeout: 15000 }).should('be.visible');
    cy.contains('WSZ Direct E-Filing Integration').should('be.visible');
  });

  it('should complete full e-filing flow with case management integration', () => {
    // Fill out the form for initial filing
    fillEFilingForm();

    // Submit the form
    cy.get('button[type="submit"]').should('contain', 'Submit eFile Batch').click();

    // Verify Tyler API submission
    cy.wait('@submitEfile').then((interception) => {
      const payload = interception.request.body.data;
      
      // Verify Tyler API payload structure
      expect(payload).to.have.property('reference_id');
      expect(payload).to.have.property('jurisdiction', 'cook:cvd1');
      expect(payload).to.have.property('case_category', '7');
      expect(payload).to.have.property('case_type');
      expect(payload).to.have.property('is_initial_filing', true);
      expect(payload.filings).to.be.an('array').that.is.not.empty;
    });

    // Verify case creation API call
    cy.wait('@createCase').then((interception) => {
      const casePayload = interception.request.body;
      
      expect(casePayload).to.have.property('userId');
      expect(casePayload).to.have.property('jurisdiction', 'il');
      expect(casePayload).to.have.property('county', 'cook');
      expect(casePayload).to.have.property('caseType');
      expect(casePayload).to.have.property('attorneyId', 'ATT123');
      expect(casePayload).to.have.property('referenceId');
    });

    // Verify document creation API call
    cy.wait('@createDocument').then((interception) => {
      const docPayload = interception.request.body;
      
      expect(docPayload).to.have.property('caseId', mockCaseId);
      expect(docPayload).to.have.property('envelopeId', 'envelope-123-test');
      expect(docPayload).to.have.property('filingId', 'filing-001');
      expect(docPayload).to.have.property('fileName');
      expect(docPayload).to.have.property('docType', 'document');
      expect(docPayload).to.have.property('status', 'submitted');
      expect(docPayload).to.have.property('timestamp');
    });

    // Verify success notification
    cy.contains('Filing Submitted').should('be.visible');
    cy.contains('Envelope envelope-123-test submitted successfully').should('be.visible');

    // Verify form is reset
    cy.get('input[name="attorneyId"]').should('have.value', '');
    cy.get('input[type="file"]').should('have.value', '');
  });

  it('should handle case management API failures gracefully', () => {
    // Mock case creation failure
    cy.intercept('POST', '/api/cases', {
      statusCode: 500,
      body: {
        error: 'Database connection failed',
        details: 'Unable to connect to database'
      }
    }).as('createCaseFail');

    // Fill and submit form
    fillEFilingForm();
    cy.get('button[type="submit"]').click();

    // Tyler API should still succeed
    cy.wait('@submitEfile');
    
    // Case creation should fail
    cy.wait('@createCaseFail');

    // Should show warning but not fail the Tyler submission
    cy.contains('Filing Submitted').should('be.visible');
    cy.contains('Case Management Warning').should('be.visible');
    cy.contains('E-filing succeeded but case record creation failed').should('be.visible');
  });

  it('should show proper loading states during submission', () => {
    // Fill out the form
    fillEFilingForm();

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Should show Tyler submission loading state
    cy.contains('Submitting to Court...').should('be.visible');
    
    // Wait for Tyler API to complete
    cy.wait('@submitEfile');
    
    // Should show case management loading state
    cy.contains('Saving Case Record...').should('be.visible');
    
    // Wait for case management to complete
    cy.wait('@createCase');
    cy.wait('@createDocument');
    
    // Should return to normal state
    cy.get('button[type="submit"]').should('contain', 'Submit eFile Batch');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('should handle duplicate document creation gracefully', () => {
    // Mock duplicate document error
    cy.intercept('POST', '/api/documents', {
      statusCode: 409,
      body: {
        error: 'Duplicate document',
        details: 'A document with this envelope ID and filing ID already exists'
      }
    }).as('createDocumentDuplicate');

    // Fill and submit form
    fillEFilingForm();
    cy.get('button[type="submit"]').click();

    // Verify Tyler API and case creation succeed
    cy.wait('@submitEfile');
    cy.wait('@createCase');
    
    // Document creation should fail with duplicate error
    cy.wait('@createDocumentDuplicate');

    // Should still show overall success (Tyler submission succeeded)
    cy.contains('Filing Submitted').should('be.visible');
  });

  it('should validate form before attempting submission', () => {
    // Try to submit without filling required fields
    cy.get('button[type="submit"]').click();

    // Should not make any API calls
    cy.get('@submitEfile.all').should('have.length', 0);
    cy.get('@createCase.all').should('have.length', 0);
    cy.get('@createDocument.all').should('have.length', 0);

    // Should show validation errors
    cy.contains('Case Type is required').should('be.visible');
    cy.contains('Attorney ID is required').should('be.visible');
  });

  function fillEFilingForm() {
    // State/Jurisdiction - Illinois
    cy.contains('label', 'State or Jurisdiction').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Illinois').click({ force: true });
    
    // County - Cook County (auto-populated)
    cy.contains('label', 'County').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Cook County').click({ force: true });
    
    // Filing Type - Initial Filing
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Initial Filing (New Case)').click({ force: true });
    
    // Case Type - Eviction
    cy.contains('label', 'Case Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Eviction').click({ force: true });
    
    // Attorney ID
    cy.get('input[name="attorneyId"]').type('ATT123');
    
    // Upload test document
    cy.get('input[type="file"]').selectFile('cypress/fixtures/eviction_complaint_template.pdf', { force: true });
  }
});