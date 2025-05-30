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

    // Mock Tyler payment accounts API
    cy.intercept('GET', '/api/tyler/payment-accounts', {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: {
        accounts: [
          { id: '203155ef-615f-4b81-a439-d1753e1fdf3b', name: 'CZ&A 2 (VISA)' },
          { id: '87323cee-d57e-4794-acb8-d899e64b8bbf', name: 'CZ&A (VISA)' },
          { id: 'e2d6c4ff-581f-4dc6-89bd-e97556bc616a', name: 'WS LAW (CEZ) (VISA)' },
          { id: '02391463-ccff-4953-99c9-7cb1a632aaa7', name: 'WS LAW (DES) (VISA)' }
        ]
      }
    }).as('getPaymentAccounts');

    // Mock Tyler attorneys API
    cy.intercept('GET', '/api/tyler/attorneys', {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: {
        attorneys: [
          { 
            id: '448c583f-aaf7-43d2-8053-2b49c810b66f',
            firmId: '5f41beaa-13d4-4328-b87b-5d7d852f9491',
            barNumber: '1111111',
            firstName: 'Sam',
            middleName: '',
            lastName: 'Smith',
            displayName: 'Sam Smith - 1111111'
          },
          { 
            id: '550c684f-bbf8-54e3-9154-3c5ad921c77g',
            firmId: '5f41beaa-13d4-4328-b87b-5d7d852f9491',
            barNumber: '2222222',
            firstName: 'Jane',
            middleName: 'M',
            lastName: 'Doe',
            displayName: 'Jane M Doe - 2222222'
          }
        ],
        count: 2
      }
    }).as('getAttorneys');

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
      
      // Verify file upload format
      const filing = payload.filings[0];
      expect(filing).to.have.property('file');
      expect(filing.file).to.match(/^base64:\/\//); // Should start with base64://
      expect(filing).to.have.property('file_name');
      expect(filing).to.have.property('doc_type', '189705');
      
      // Verify case parties include Unknown Occupants
      expect(payload).to.have.property('case_parties');
      expect(payload.case_parties).to.be.an('array').with.lengthOf.at.least(3);
      
      // Find Unknown Occupants in the case parties
      const unknownOccupants = payload.case_parties.find(
        party => party.first_name === 'All' && party.last_name === 'Unknown Occupants'
      );
      expect(unknownOccupants).to.exist;
      expect(unknownOccupants.type).to.equal('189131'); // Defendant type code
      expect(unknownOccupants.is_business).to.equal('false');
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

  it('should display Unknown Occupants as second defendant', () => {
    // Fill in state to enable form
    cy.contains('label', 'State or Jurisdiction').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Illinois').click({ force: true });
    
    // Verify Unknown Occupants section is visible
    cy.contains('Second Defendant (Automatically Included)').should('be.visible');
    cy.contains('All Unknown Occupants').should('be.visible');
    cy.contains('Same as primary defendant').should('be.visible');
    cy.contains('"All Unknown Occupants" is automatically added as a second defendant').should('be.visible');
  });

  it('should show lead attorney dropdown and allow selection', () => {
    // Fill in state to enable form
    cy.contains('label', 'State or Jurisdiction').parent().find('button').click({ force: true });
    cy.contains('[role="option"]', 'Illinois').click({ force: true });
    
    // Verify Lead Attorney dropdown is visible in petitioner section
    cy.get('[data-cy="petitioner-card"]').within(() => {
      cy.contains('Lead Attorney').should('be.visible');
      
      // Click on the lead attorney dropdown
      cy.get('[data-cy="lead-attorney-select"]').click({ force: true });
      
      // Verify attorneys are loaded
      cy.contains('[role="option"]', 'Sam Smith - 1111111').should('be.visible');
      cy.contains('[role="option"]', 'Jane M Doe - 2222222').should('be.visible');
      
      // Select an attorney
      cy.contains('[role="option"]', 'Jane M Doe - 2222222').click({ force: true });
      
      // Verify selection was made
      cy.get('[data-cy="lead-attorney-select"]').should('contain', 'Jane M Doe - 2222222');
      
      // Verify "+ Add Attorney" button is visible
      cy.contains('+ Add Attorney').should('be.visible');
    });
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