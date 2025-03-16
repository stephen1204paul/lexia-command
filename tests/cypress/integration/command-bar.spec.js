/// <reference types="cypress" />

describe('Lexia Command Bar', () => {
  beforeEach(() => {
    // Log in to WordPress admin
    cy.login('admin', 'password');
    
    // Visit the dashboard
    cy.visit('/wp-admin/');
    
    // Wait for the page to load completely
    cy.wait(1000);
  });

  it('should open when keyboard shortcut is pressed', () => {
    // Press CMD+K (or CTRL+K)
    cy.get('body').type('{cmd+k}');
    
    // Verify command bar is visible
    cy.get('#lexia-command-root .lexia-command-modal').should('be.visible');
  });

  it('should close when Escape key is pressed', () => {
    // Open command bar
    cy.get('body').type('{cmd+k}');
    
    // Verify command bar is visible
    cy.get('#lexia-command-root .lexia-command-modal').should('be.visible');
    
    // Press Escape key
    cy.get('body').type('{esc}');
    
    // Verify command bar is closed
    cy.get('#lexia-command-root .lexia-command-modal').should('not.exist');
  });

  it('should search for content when typing', () => {
    // Open command bar
    cy.get('body').type('{cmd+k}');
    
    // Type search query
    cy.get('#lexia-command-root .lexia-command-search').type('test');
    
    // Wait for search results
    cy.wait(500);
    
    // Verify search results are displayed
    cy.get('#lexia-command-root .lexia-command-result').should('exist');
  });

  it('should navigate between search results with arrow keys', () => {
    // Open command bar
    cy.get('body').type('{cmd+k}');
    
    // Type search query
    cy.get('#lexia-command-root .lexia-command-search').type('test');
    
    // Wait for search results
    cy.wait(1000);
    
    // Press down arrow to select first result
    cy.get('#lexia-command-root .lexia-command-search').type('{downarrow}');
    
    // Verify first result is selected
    cy.get('#lexia-command-root .lexia-command-result').first().should('have.attr', 'data-selected', 'true');
  });
});