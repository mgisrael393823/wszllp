describe('E-Filing Flows', () => {
  beforeEach(() => {
    // Login to Supabase
    cy.loginSupabase();
    
    // Set Phase B environment for testing
    cy.window().then((win) => {
      win.localStorage.setItem('VITE_ENHANCED_EFILING_PHASE_B', 'true');
    });
    
    // Set up API intercepts
    cy.intercept('POST', '**/v4/il/efile', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          envelope_id: 'test-envelope-123',
          reference_id: 'REF-001',
          status: 'submitted'
        }
      }
    }).as('submitEfile');

    // Mock Tyler jurisdictions API
    cy.intercept('GET', '/api/tyler/jurisdictions', {
      statusCode: 200,
      body: {
        jurisdictions: [
          { code: 'cook:M1', label: 'Municipal Civil – District 1 (Chicago)', state: 'il' },
          { code: 'cook:M2', label: 'Municipal Civil – District 2 (Skokie)', state: 'il' },
          { code: 'cook:M3', label: 'Municipal Civil – District 3 (Rolling Meadows)', state: 'il' },
          { code: 'cook:M4', label: 'Municipal Civil – District 4 (Maywood)', state: 'il' },
          { code: 'cook:M5', label: 'Municipal Civil – District 5 (Bridgeview)', state: 'il' },
          { code: 'cook:M6', label: 'Municipal Civil – District 6 (Markham)', state: 'il' },
        ]
      }
    }).as('getJurisdictions');

    // Visit e-filing page
    cy.visit('/documents/efile');
    
    // Wait for form to load
    cy.get('[data-cy=efile-form]', { timeout: 15000 }).should('be.visible');
    cy.contains('WSZ Direct E-Filing Integration').should('be.visible');
  });

  it('should complete initial filing flow with Phase B jurisdiction codes', () => {
    // Fill out the form for initial filing
    // State/Jurisdiction
    cy.contains('label', 'State or Jurisdiction').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Illinois').click({ force: true });
    
    // Phase B: Jurisdiction dropdown should be visible instead of County
    cy.contains('label', 'Jurisdiction').should('be.visible');
    cy.get('[data-cy="jurisdiction-select"]').click({ force: true });
    cy.contains('[role="option"]', 'Municipal Civil – District 1 (Chicago)').click({ force: true });
    
    // Filing Type - Select Initial Filing
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Initial Filing (New Case)').click({ force: true });
    
    // Case Type
    cy.contains('label', 'Case Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Eviction').click({ force: true });
    
    // Attorney ID
    cy.contains('label', 'Attorney ID').parent().find('input').type('ATT123');
    
    // Upload a test document
    cy.get('input[type="file"]').selectFile('cypress/fixtures/eviction_complaint_template.pdf', { force: true });
    
    // Submit the form
    cy.contains('button', 'Submit eFile Batch').click();
    
    // Verify the API call was made with correct Phase B jurisdiction code
    cy.wait('@submitEfile').then((interception) => {
      const payload = interception.request.body.data;
      
      // Should NOT have case_number for initial filing
      expect(payload).to.not.have.property('case_number');
      
      // Should be marked as initial filing
      expect(payload.is_initial_filing).to.be.true;
      
      // Should NOT have cross_references for initial filing
      expect(payload).to.not.have.property('cross_references');
      
      // Should have required fields with Phase B jurisdiction code
      expect(payload).to.have.property('reference_id');
      expect(payload).to.have.property('jurisdiction', 'cook:M1'); // Phase B format
      expect(payload).to.have.property('case_type', '174140');
      expect(payload).to.have.property('filing_attorney_id', 'ATT123');
      expect(payload.filings).to.be.an('array').that.is.not.empty;
    });
  });

  it('should complete subsequent filing flow with Phase B jurisdiction codes', () => {
    // Fill out the form for subsequent filing
    // State/Jurisdiction
    cy.contains('label', 'State or Jurisdiction').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Illinois').click({ force: true });
    
    // Phase B: Jurisdiction dropdown instead of County
    cy.get('[data-cy="jurisdiction-select"]').click({ force: true });
    cy.contains('[role="option"]', 'Municipal Civil – District 2 (Skokie)').click({ force: true });
    
    // Filing Type - Select Subsequent Filing
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Subsequent Filing (Existing Case)').click({ force: true });
    
    // Existing Case Number field should appear
    cy.contains('label', 'Existing Case Number').should('be.visible');
    cy.contains('label', 'Existing Case Number').parent().find('input').type('2024-EV-123456');
    
    // Case Type
    cy.contains('label', 'Case Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Eviction').click({ force: true });
    
    // Attorney ID
    cy.contains('label', 'Attorney ID').parent().find('input').type('ATT123');
    
    // Upload a test document
    cy.get('input[type="file"]').selectFile('cypress/fixtures/eviction_complaint_template.pdf', { force: true });
    
    // Submit the form
    cy.contains('button', 'Submit eFile Batch').click();
    
    // Verify the API call was made with correct Phase B jurisdiction code
    cy.wait('@submitEfile').then((interception) => {
      const payload = interception.request.body.data;
      
      // Should NOT have case_number for subsequent filing (uses cross_references)
      expect(payload).to.not.have.property('case_number');
      
      // Should be marked as NOT initial filing
      expect(payload.is_initial_filing).to.be.false;
      
      // Should have cross_references for subsequent filing
      expect(payload).to.have.property('cross_references');
      expect(payload.cross_references).to.be.an('array').that.has.lengthOf(1);
      expect(payload.cross_references[0]).to.deep.equal({
        type: 'CASE_NUMBER',
        number: '2024-EV-123456'
      });
      
      // Should have required fields with Phase B jurisdiction code
      expect(payload).to.have.property('reference_id');
      expect(payload).to.have.property('jurisdiction', 'cook:M2'); // Phase B format for District 2
      expect(payload).to.have.property('case_type', '174140');
      expect(payload).to.have.property('filing_attorney_id', 'ATT123');
    });
  });

  it('should show Phase B jurisdiction dropdown with all 6 Cook County options', () => {
    // Verify jurisdiction dropdown is visible (Phase B)
    cy.contains('label', 'Jurisdiction').should('be.visible');
    
    // Verify County dropdown is NOT visible (Phase A disabled)
    cy.contains('label', 'County').should('not.exist');
    
    // Open jurisdiction dropdown
    cy.get('[data-cy="jurisdiction-select"]').click({ force: true });
    
    // Verify all 6 Cook County options are present
    cy.contains('[role="option"]', 'Municipal Civil – District 1 (Chicago)').should('be.visible');
    cy.contains('[role="option"]', 'Municipal Civil – District 2 (Skokie)').should('be.visible');
    cy.contains('[role="option"]', 'Municipal Civil – District 3 (Rolling Meadows)').should('be.visible');
    cy.contains('[role="option"]', 'Municipal Civil – District 4 (Maywood)').should('be.visible');
    cy.contains('[role="option"]', 'Municipal Civil – District 5 (Bridgeview)').should('be.visible');
    cy.contains('[role="option"]', 'Municipal Civil – District 6 (Markham)').should('be.visible');
    
    // Select one option to test functionality
    cy.contains('[role="option"]', 'Municipal Civil – District 3 (Rolling Meadows)').click({ force: true });
    
    // Verify the selection was made
    cy.get('[data-cy="jurisdiction-select"]').should('contain', 'Municipal Civil – District 3 (Rolling Meadows)');
  });

  it('should conditionally show/hide existing case number input based on filing type', () => {
    // Initially, existing case number should not be visible
    cy.contains('label', 'Existing Case Number').should('not.exist');
    
    // Select Initial Filing - should still be hidden
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Initial Filing (New Case)').click({ force: true });
    cy.contains('label', 'Existing Case Number').should('not.exist');
    
    // Switch to Subsequent Filing - should become visible
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Subsequent Filing (Existing Case)').click({ force: true });
    cy.contains('label', 'Existing Case Number').should('be.visible');
    
    // Switch back to Initial Filing - should hide again
    cy.contains('label', 'Filing Type').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Initial Filing (New Case)').click({ force: true });
    cy.contains('label', 'Existing Case Number').should('not.exist');
  });
});