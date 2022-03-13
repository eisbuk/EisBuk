import { v4 as uuid } from "uuid";
import { AuthErrorCodes } from "@firebase/auth";

import i18n from "@/i18next/i18n";

import { PrivateRoutes } from "@/enums/routes";
import {
  ActionButton,
  AdminAria,
  AuthMessage,
  AuthTitle,
  AuthErrorMessage,
  ValidationMessage,
} from "@/enums/translations";

import { defaultUser } from "@/__testSetup__/envData";

/** A convenience method, to avoid having to write '' each time */
const t = (input: string, params?: Record<string, any>): string =>
  i18n.t(input, params);

describe("login", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization but don't sign in
    cy.initAdminApp().then(() => cy.visit(PrivateRoutes.Root));
  });

  afterEach(() => {
    cy.signOut();
  });

  describe("Email login", () => {
    beforeEach(() => {
      // start email auth flow
      cy.clickButton(t(AuthTitle.SignInWithEmail));
    });

    it("loggs in with existing email", () => {
      cy.contains(t(AuthTitle.SignInWithEmail));
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(AuthTitle.SignIn));
      cy.getAttrWith("type", "password").type(defaultUser.password);
      cy.clickButton(t(ActionButton.SignIn));
      // on successful login, should show admin nav bar (among other things)
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("creates a new account with not-yet-registered email", () => {
      // since auth service is shared amongst all organizations
      // we're creating a new email each time to ensure the current email
      // is not yet registered (by any previous tests)
      const randomString = uuid().slice(0, 10);
      const newEmail = `${randomString}@email.com`;

      cy.getAttrWith("type", "email").type(newEmail);
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(AuthTitle.CreateAccount));
      cy.getAttrWith("id", "name").type("Slim Shady");
      /** Name should be required */
      cy.getAttrWith("type", "password").type("non-relevant-password");
      cy.clickButton(t(ActionButton.Save));
      // user is registered, but not added as an admin yet - should redirect to unauthorized page
      cy.contains(t(AuthMessage.NotAuthorized));
    });

    it("sends a password reset email on demand", () => {
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      // wait until on second step (to prevent flaky button queries)
      cy.getAttrWith("type", "password");
      cy.clickButton(t(ActionButton.TroubleSigningIn));
      // help step
      cy.contains(t(AuthTitle.RecoverPassword));
      cy.contains(t(AuthMessage.RecoverPassword));
      cy.clickButton(t(ActionButton.Send));
      // mail sent step
      cy.contains(t(AuthTitle.CheckYourEmail));
      cy.contains(
        t(AuthMessage.CheckPasswordRecoverEmail, {
          email: defaultUser.email,
        })
      );
      cy.clickButton(t(ActionButton.Done));
      // should return to first step
      cy.contains("Sign in with phone");
      cy.contains("Sign in with Google");
      cy.contains("Sign in with email");
    });

    it("displays error messages for errors received from auth SDK (if any)", () => {
      // check trying to sign in with non-existing password
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      cy.getAttrWith("type", "email").clearAndType("non@existing.com");
      cy.getAttrWith("type", "password").type(defaultUser.password);
      cy.clickButton(t(ActionButton.SignIn));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.USER_DELETED]));

      cy.contains("Dismiss").click();
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.USER_DELETED])).should(
        "not.exist"
      );

      // check trying to send password recovery email to non-registered email
      cy.clickButton(t(ActionButton.TroubleSigningIn));
      cy.clickButton(t(ActionButton.Send));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.USER_DELETED]));

      // start over
      cy.contains("Dismiss").click();
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.USER_DELETED])).should(
        "not.exist"
      );
      cy.clickButton(t(ActionButton.Cancel));

      // check mismatched password
      cy.clickButton(t(AuthTitle.SignInWithEmail));
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      cy.getAttrWith("type", "password").type("invalid-password");
      cy.clickButton(t(ActionButton.SignIn));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.INVALID_PASSWORD]));
    });

    it("validates the form before submiting", () => {
      // email is required
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(ValidationMessage.RequiredField));
      // email should be a valid email string
      cy.getAttrWith("type", "email").type("invalid-email@string");
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(ValidationMessage.Email));

      // move to create user flow
      cy.getAttrWith("type", "email").clearAndType("valid-email@gmail.com");
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(AuthTitle.CreateAccount)).click();

      // name is a required field
      cy.getAttrWith("type", "password").type("any-password");
      cy.clickButton(t(ActionButton.Save));
      // the following error is displayed for "name" field
      cy.contains(t(ValidationMessage.RequiredField));
      cy.getAttrWith("id", "name").type("Slim Shady");

      // password is required
      cy.getAttrWith("type", "password").clear();
      cy.contains(t(ValidationMessage.RequiredField));
      // password should be at least 6 characters
      cy.getAttrWith("type", "password").type(t("weak"));
      cy.contains(t(ValidationMessage.WeakPassword, { min: 6 })).click();

      // reset the flow
      cy.clickButton(t(ActionButton.Cancel));

      // check sign in flow
      cy.clickButton(t(AuthTitle.SignInWithEmail));
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      // password is required
      cy.clickButton(t(ActionButton.SignIn));
      cy.contains(t(ValidationMessage.RequiredField));
      // password should pass even if less than 6 characters (even though password like that won't exist in backend)
      // this will fail anyhow on email-password mismatch
      cy.getAttrWith("type", "password").type("weak");
      cy.clickButton(t(ActionButton.SignIn));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.INVALID_PASSWORD]));
    });
  });

  describe("Phone login", () => {
    beforeEach(() => {
      // start email auth flow
      cy.clickButton(t(AuthTitle.SignInWithPhone));
    });

    it("sends login code to user and loggs in on successful code entry", () => {
      cy.contains(t(AuthTitle.SignInWithPhone));
      // should display data rates warning
      cy.contains(t(AuthMessage.SMSDataRatesMayApply));
      cy.getAttrWith("type", "phone").type(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(AuthTitle.EnterCode));
      cy.getRecaptchaCode(defaultUser.phone).then((code) => {
        cy.getAttrWith("id", "code").type(code);
        return cy.clickButton(t(ActionButton.Submit));
      });
      // on successful login, should show admin nav bar (among other things)
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("validates input fields", () => {
      // phone number is required
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(ValidationMessage.RequiredField));
      // phone number should be a valid phone number
      cy.getAttrWith("type", "phone").type("not-a-number");
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(ValidationMessage.InvalidPhone));

      cy.getAttrWith("type", "phone").clearAndType(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));

      // sms code is required
      cy.contains(t(AuthTitle.EnterCode));
      cy.clickButton(t(ActionButton.Submit));
      cy.contains(t(ValidationMessage.RequiredField));
    });

    it("shows error message on wrong code", () => {
      cy.getAttrWith("type", "phone").clearAndType(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));
      cy.getAttrWith("id", "code").type("wrong-code");
      cy.clickButton(t(ActionButton.Submit));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.INVALID_CODE]));
    });
  });

  describe("Email link login", () => {
    beforeEach(() => {
      cy.clickButton(t(AuthTitle.SignInWithEmailLink));
    });

    it("logs in using link sent via email", () => {
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      // should show check your email message on successful send
      cy.contains(t(AuthTitle.CheckYourEmail));
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );
      // should return to auth screen on "Done" button click
      cy.clickButton(t(ActionButton.Done));

      // check email-sent link validity and finalization of the flow
      cy.getSigninLink(defaultUser.email).then((link) => cy.visit(link));
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("creates a new user if email not registered", () => {
      // since auth service is shared amongst all organizations
      // we're creating a new email each time to ensure the current email
      // is not yet registered (by any previous tests)
      const randomString = uuid().slice(0, 10);
      const newEmail = `${randomString}@email.com`;

      cy.getAttrWith("type", "email").type(newEmail);
      cy.clickButton(t(ActionButton.Send));
      cy.getSigninLink(newEmail).then((link) => cy.visit(link));
      // user is registered, but not added as an admin yet - should redirect to unauthorized page
      cy.contains(t(AuthMessage.NotAuthorized));
    });

    it("prompts user for email (on auth flow completion) if no 'emailForSignIn' in local storage", () => {
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      cy.contains(t(AuthTitle.CheckYourEmail));
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );

      // expect the email confirmation prompt on sign in link click
      cy.clearLocalStorage();
      cy.getSigninLink(defaultUser.email).then((link) => cy.visit(link));
      cy.contains(t(AuthTitle.ConfirmEmail));
      cy.contains(t(AuthMessage.ConfirmSignInEmail));
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Verify));
    });
  });
});
