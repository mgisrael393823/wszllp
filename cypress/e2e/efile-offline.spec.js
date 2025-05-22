/// <reference types="cypress" />

describe('E-Filing Offline Draft Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Mock API responses
    cy.intercept('POST', '**/v4/il/user/authenticate', {
      statusCode: 200,
      body: {
        auth_token: 'mock-auth-token-1234567890',
        expires_in: 3600
      }
    }).as('authenticate');
    
    // Mock authentication token to bypass auth flow
    cy.mockEfileToken();
    
    // Visit the e-filing page
    cy.visit('/efile');
  });

  it('should save a draft when form is partially filled', () => {
    // Fill out part of the e-filing form
    cy.get('select[name="jurisdiction"]').select('il');
    cy.get('select[name="county"]').select('cook');
    cy.get('input[name="caseNumber"]').type('2025-CV-12345');
    
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
    
    // Simulate clicking a "Save Draft" button or triggering autosave
    // For this test we'll directly manipulate the local storage
    cy.window().then(win => {
      // Create a draft object
      const draftId = 'draft-12345';
      const now = new Date().toISOString();
      const draft = {
        draftId,
        formData: {
          jurisdiction: 'il',
          county: 'cook',
          caseNumber: '2025-CV-12345',
          attorneyId: '',
          files: [{
            id: 'file-12345',
            name: 'eviction_complaint_template.pdf',
            size: 864494,
            type: 'application/pdf'
          }]
        },
        savedAt: now,
        caseId: '2025-CV-12345',
        autoSaved: true
      };
      
      // Get existing drafts from localStorage
      let drafts = {};
      try {
        const storedDrafts = win.localStorage.getItem('efile_drafts');
        if (storedDrafts) {
          drafts = JSON.parse(storedDrafts);
        }
      } catch (e) {
        console.error('Error parsing drafts', e);
      }
      
      // Add our new draft
      drafts[draftId] = draft;
      
      // Save back to localStorage
      win.localStorage.setItem('efile_drafts', JSON.stringify(drafts));
    });
    
    // Reload the page to simulate coming back after being offline
    cy.reload();
    
    // Check that we see the draft restoration toast
    cy.contains('Draft Available').should('be.visible');
    
    // Check that we can see the loaded form data
    cy.get('select[name="jurisdiction"]').should('have.value', 'il');
    cy.get('select[name="county"]').should('have.value', 'cook');
    cy.get('input[name="caseNumber"]').should('have.value', '2025-CV-12345');
  });

  it('should purge expired drafts', () => {
    cy.window().then(win => {
      // Create drafts with different dates
      const now = new Date();
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(now.getDate() - 8);
      
      const drafts = {
        'recent-draft': {
          draftId: 'recent-draft',
          formData: {
            jurisdiction: 'il',
            county: 'cook',
            caseNumber: '2025-CV-12345',
            attorneyId: '',
            files: []
          },
          savedAt: now.toISOString(),
          caseId: '2025-CV-12345',
          autoSaved: true
        },
        'expired-draft': {
          draftId: 'expired-draft',
          formData: {
            jurisdiction: 'ca',
            county: 'losangeles',
            caseNumber: '2025-CA-54321',
            attorneyId: '',
            files: []
          },
          savedAt: eightDaysAgo.toISOString(),
          caseId: '2025-CA-54321',
          autoSaved: true
        }
      };
      
      // Save to localStorage
      win.localStorage.setItem('efile_drafts', JSON.stringify(drafts));
    });
    
    // Reload the page to trigger draft purging on load
    cy.reload();
    
    // Check localStorage to verify the expired draft was purged
    cy.window().then(win => {
      const storedDrafts = JSON.parse(win.localStorage.getItem('efile_drafts'));
      
      // Should only have the recent draft
      expect(Object.keys(storedDrafts)).to.have.length(1);
      expect(storedDrafts).to.have.property('recent-draft');
      expect(storedDrafts).not.to.have.property('expired-draft');
    });
  });
});