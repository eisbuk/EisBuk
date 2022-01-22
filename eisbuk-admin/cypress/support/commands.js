// / <reference types="cypress" />

/**
 * @param {string} attr A DOM element attribute - e.g [attr=]
 * @param {string} label A value for the attribute - [=label]
 * @param {boolean} strict Default True. False means attribute value can contain label - [*=label]
 */
Cypress.Commands.add("getAttrWith", (attr, label, strict = true) => {
  const glob = strict ? "" : "*";
  return cy.get(`[${attr}${glob}="${label}"]`);
});
