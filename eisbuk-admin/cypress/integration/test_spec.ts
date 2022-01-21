describe("login", () => {
  it("saves a message to log file", () => {
    cy.updateFirestore("test-organziation", "testFile");
  });
});
