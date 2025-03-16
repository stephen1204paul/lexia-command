// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to log in to WordPress
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/wp-login.php');
  cy.get('#user_login').type(username);
  cy.get('#user_pass').type(password);
  cy.get('#wp-submit').click();
  
  // Verify we're logged in by checking for admin bar
  cy.get('#wpadminbar').should('exist');
});