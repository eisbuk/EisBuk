import { type Customer } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AttendanceNavigationLabel,
} from "@eisbuk/translations";

import { PrivateRoutes, Routes } from "../temp";

import { customers } from "../__testData__/customers.json";

describe("auth-related redirects", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization but don't sign in
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(organization, customers as Record<string, Customer>)
    );
  });

  afterEach(() => {
    cy.signOut().then(() => cy.clearLocalStorage());
  });

  describe("non authenticated user", () => {
    it("redirects a non authenticated user to a login page", () => {
      // Check for /athletes page
      cy.visit(PrivateRoutes.Athletes);
      cy.url().should("include", "/login");

      // Check for /athletes/new page
      cy.visit(PrivateRoutes.NewAthlete);
      cy.url().should("include", "/login");

      // Check for /athletes/:id page
      cy.visit([PrivateRoutes.Athletes, customers.saul.id].join("/"));
      cy.url().should("include", "/login");

      // Check for attendance ("/") page
      cy.visit(PrivateRoutes.Root);
      cy.url().should("include", "/login");

      // Check for slots page
      cy.visit(PrivateRoutes.Slots);
      cy.url().should("include", "/login");

      // Check for admin preferences page
      cy.visit(PrivateRoutes.AdminPreferences);
      cy.url().should("include", "/login");
    });

    it("allows non authenticated user, in possession of secret key, to access bookings page for a customer in possession of said secret key", () => {
      cy.visit([Routes.CustomerArea, customers.saul.secretKey].join("/"));
      // We check the customer area page being loaded by looking for the customer avatar (with name)
      cy.contains(`${customers.saul.name} ${customers.saul.surname}`);
    });
  });

  describe("authenticated non-admin", () => {
    it("redirects to customer area page from any of the private routes", () => {
      const { email, password, secretKey } = customers.saul;

      // Sign up (or sign in on each subsequent test) as saul.
      // Saul is already registered in the app (in customers collection).
      cy.signUp(email, password);

      // Check for /athletes page
      cy.visit(PrivateRoutes.Athletes);
      cy.url().should("include", secretKey);

      // Check for /athletes/new page
      cy.visit(PrivateRoutes.NewAthlete);
      cy.url().should("include", secretKey);

      // Check for /athletes/:id page
      cy.visit([PrivateRoutes.Athletes, customers.saul.id].join("/"));
      cy.url().should("include", secretKey);

      // Check for attendance ("/") page
      cy.visit(PrivateRoutes.Root);
      cy.url().should("include", secretKey);

      // Check for slots page
      cy.visit(PrivateRoutes.Slots);
      cy.url().should("include", secretKey);

      // Check for admin preferences page
      cy.visit(PrivateRoutes.AdminPreferences);
      cy.url().should("include", secretKey);

      // If landing on 'customer_area' page, should automatically be redirected to their own customer area page (with their secret key)
      cy.visit(Routes.CustomerArea);
      cy.url().should("include", secretKey);

      // The following is an edge case, is a bit tricky to implement and we should confirm that is, in fact, the desired behaviour
      //
      // // If landing on customer area page, with wrong secret key, should be redirected to their own page page
      // cy.visit([Routes.CustomerArea, "wrong_secret_key"].join("/"));
      // cy.contains(`${name} ${surname}`);
    });
  });

  describe("authenticated, but not fully registered (no secret key)", () => {
    it("should redirect to /self_register page to complete the athlete registration", () => {
      // Sign up (or sign in on each subsequent test) as a random user, which
      // doesn't exist in the customers collection (has no secret key).
      cy.signUp("some@email.com", "passw03d");

      // Check for /athletes page
      cy.visit(PrivateRoutes.Athletes);
      cy.url().should("include", "/self_register");

      // Check for /athletes/new page
      cy.visit(PrivateRoutes.NewAthlete);
      cy.url().should("include", "/self_register");

      // Check for /athletes/:id page
      cy.visit([PrivateRoutes.Athletes, customers.saul.id].join("/"));
      cy.url().should("include", "/self_register");

      // Check for attendance ("/") page
      cy.visit(PrivateRoutes.Root);
      cy.url().should("include", "/self_register");

      // Check for slots page
      cy.visit(PrivateRoutes.Slots);
      cy.url().should("include", "/self_register");

      // Check for admin preferences page
      cy.visit(PrivateRoutes.AdminPreferences);
      cy.url().should("include", "/self_register");

      // Landing on '/customer_area' page, without the secret key, should redirect to self_register
      cy.visit(Routes.CustomerArea);
      cy.url().should("include", "/self_register");

      // Even if langing on login page, should be redirected to self_register
      cy.visit(Routes.Login);
      cy.url().should("include", "/self_register");
    });
  });

  describe("authenticated admin", () => {
    it("redirects to attendance page if authenticated admin opens the login page", () => {
      // Sign in with default user (admin)
      cy.signIn();
      cy.visit(Routes.Login);

      // Check that we're redirected to attendance page by checking for attendance page sub-nav
      cy.contains(i18n.t(AttendanceNavigationLabel.Day) as string);
      cy.contains(i18n.t(AttendanceNavigationLabel.Month) as string);

      // Edge case: if landing on '/customer_area' page, without the secret key, should redirect to '/athletes' page.
      // From there, the admin can navigate to any customer's '/customer_area' page (with appropriate secret key)
      cy.visit(Routes.CustomerArea);
      cy.url().should("include", PrivateRoutes.Athletes);
    });

    it("logs out and redirects to the login page on 'Log out' button click", () => {
      // Sign in with default user (admin)
      cy.signIn();
      cy.visit("/");

      // Click the logout button
      cy.clickButton(i18n.t(ActionButton.LogOut) as string);

      // Check that we're redirected to login page
      cy.url().should("include", Routes.Login);
    });
  });
});
