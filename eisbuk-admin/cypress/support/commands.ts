/* eslint-disable @typescript-eslint/no-namespace */
// ***********************************************************
//
// When adding a new Command in command initializing procedure, add the
// function interface here as well in order to be able to use
// it in tests without TypeScript complaining
//
// All of the commands should extend the following interface:
//
//       (...args?: any[]) => Chainable<R extends any = null>
//
// ***********************************************************
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * @param {string} attr A DOM element attribute - e.g [attr=]
       * @param {string} label A value for the attribute - [=label]
       * @param {boolean} strict Default True. False means attribute value can contain label - [*=label]
       * @returns {Chainable<Element>} a `PromiseLike` yielding found `Element`
       */
      getAttrWith: (
        attr: string,
        label: string,
        strict?: boolean
      ) => Chainable<Element>;
      /**
       * @param {number} millis milliseconds from UNIX epoch, such as it's received from `Date.now()`.
       */
      setClock: (millis: number) => Chainable<Clock>;
    }
  }
}

/**
 * We're initializing custom commands as a procedure, rather than a
 * file as this (for whatever reason) works with typescript, and the other approach doesn't
 */
export default (): void => {
  Cypress.Commands.add("getAttrWith", (attr, label, strict = true) => {
    const glob = strict ? "" : "*";
    return cy.get(`[${attr}${glob}="${label}"]`);
  });

  Cypress.Commands.add("setClock", (millis) =>
    cy.clock().then((clock) => {
      clock.restore();
      // currently we're only overriding the `Date` object
      // as overriding `setTimeout` will mess with firebase auth state
      // due to firebase auth being set up to revalidate the token each hour
      return cy.clock(millis, ["Date"]);
    })
  );
};
