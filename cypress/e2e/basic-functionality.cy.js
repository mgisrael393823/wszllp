/// <reference types="cypress" />

describe('Basic Functionality Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    cy.clearLocalStorage();
    
    // Setup mock Supabase session
    cy.setupSupabaseSession({
      email: 'test@example.com',
      id: 'test-user-123'
    });
  });

  it('should load the login page', () => {
    cy.visit('/login');
    cy.contains('Sign in').should('be.visible');
  });

  it('should navigate to dashboard after mock login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('should load the cases page', () => {
    cy.visit('/dashboard/cases');
    cy.url().should('include', '/dashboard/cases');
    // The page should not show an error
    cy.contains('Something went wrong').should('not.exist');
  });

  it('should have working navigation', () => {
    cy.visit('/dashboard');
    
    // Check that sidebar navigation exists
    cy.get('nav').should('be.visible');
    
    // Navigate to different pages
    cy.contains('Cases').click();
    cy.url().should('include', '/dashboard/cases');
    
    cy.contains('Contacts').click();
    cy.url().should('include', '/dashboard/contacts');
  });
});