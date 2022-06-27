import { v4 as uuid } from "uuid";
import { AuthErrorCodes } from "@firebase/auth";

import i18n, {
  ActionButton,
  AdminAria,
  AuthMessage,
  AuthTitle,
  AuthErrorMessage,
  ValidationMessage,
} from "@eisbuk/translations";
import { Customer } from "@eisbuk/shared";

import { PrivateRoutes, defaultUser } from "../temp";

import testCustomers from "../__testData__/customers.json";

// extract saul from test data .json
const saul = testCustomers.customers.saul as Required<Customer>;

/** A convenience method, to avoid having to write '' each time */
const t = (input: string, params?: Record<string, any>): string =>
  i18n.t(input, params);

describe("login", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization but don't sign in
    cy.initAdminApp()
      .then((organization) =>
        cy.updateFirestore(organization, ["customers.json"])
      )
      .then(() => cy.visit(PrivateRoutes.Root));
  });

  afterEach(() => {
    cy.signOut().then(() => cy.clearLocalStorage());
  });

  describe("Email login", () => {
    beforeEach(() => {
      // This test was failing from time to time: Cypress would enter the test
      // with an already logged in user
      cy.clearCookies();
      cy.visit(PrivateRoutes.Root);
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
      // Name should be required
      cy.getAttrWith("type", "password").type("non-relevant-password");
      cy.clickButton(t(ActionButton.Save));
      // user is registered, but not added as an admin yet - should redirect to not-registered page
      cy.contains(t(AuthMessage.NotRegistered));
    });

    it("sends a password reset email on demand", () => {
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Next));
      // wait until on second step (to prevent flaky button queries)
      cy.getAttrWith("type", "password");
      cy.clickButton(t(ActionButton.TroubleSigningIn));
      // help step
      cy.contains(t(AuthTitle.RecoverPassword));
      cy.contains(t(AuthMessage.RecoverEmailPassword));
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
      cy.getAttrWith("id", "phone").type(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(AuthTitle.EnterCode));
      cy.getRecaptchaCode(defaultUser.phone).then((code) => {
        cy.getAttrWith("id", "code").type(code);
        return cy.clickButton(t(ActionButton.Submit));
      });
      // on successful login, should show admin nav bar (among other things)
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("shows code sent message (with phone number confirmation) and allows resend ", () => {
      cy.contains(t(AuthTitle.SignInWithPhone));
      cy.getAttrWith("id", "phone").type(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(AuthTitle.EnterCode));
      // check for phone confirmation message
      cy.contains(t(AuthMessage.EnterSMSCode, { phone: defaultUser.phone }));
      // should offer to resent if code not received
      cy.clickButton(t(ActionButton.CodeNotReceived));
      cy.contains(t(AuthTitle.ResendSMS));
      cy.contains(t(AuthMessage.ResendSMS, { phone: defaultUser.phone }));
      cy.clickButton(t(ActionButton.Resend));
      // should redirect back to EnterSMSCode prompt
      cy.contains(t(AuthMessage.EnterSMSCode, { phone: defaultUser.phone }));
      cy.getRecaptchaCode(defaultUser.phone).then((code) => {
        cy.getAttrWith("id", "code").type(code);
        return cy.clickButton(t(ActionButton.Submit));
      });
      // login should be successful
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("validates input fields", () => {
      // phone number is required
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(ValidationMessage.RequiredField));
      // phone number should be a valid phone number
      cy.getAttrWith("id", "phone").type("not-a-number");
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(ValidationMessage.InvalidPhone));

      cy.getAttrWith("id", "phone").clearAndType(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));

      // sms code is required
      cy.contains(t(AuthTitle.EnterCode));
      cy.clickButton(t(ActionButton.Submit));
      cy.contains(t(ValidationMessage.RequiredField));
    });

    it("shows error message on wrong code and resets auth on cancel click", () => {
      cy.getAttrWith("id", "phone").clearAndType(defaultUser.phone);
      cy.clickButton(t(ActionButton.Verify));
      cy.getAttrWith("id", "code").type("wrong-code");
      cy.clickButton(t(ActionButton.Submit));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.INVALID_CODE]));
    });

    it("resets form on cancel button click", () => {
      cy.contains(t(AuthTitle.SignInWithPhone));
      cy.clickButton(t(ActionButton.Cancel));
      cy.contains(t(AuthTitle.SignInWithPhone));
      cy.contains(t(AuthTitle.SignInWithGoogle));
      cy.contains(t(AuthTitle.SignInWithEmail));
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
      // user is registered, but not added as an admin yet - should redirect to not-registered page
      cy.contains(t(AuthMessage.NotRegistered));
    });

    it("prompts user for email (on auth flow completion) if no 'emailForSignIn' in local storage", () => {
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      // wait for `check email` message to prevent race condition in the following assertions
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
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("handles errors in a predictable way", () => {
      // test email validation
      cy.getAttrWith("type", "email").type("invalid-email@string");
      cy.clickButton(t(ActionButton.Send));
      cy.contains(t(ValidationMessage.Email));
      cy.getAttrWith("type", "email").clearAndType(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      // wait for `check email` message to prevent race condition in the following assertions
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );

      // test trying to log in using wrong sign in email
      cy.clearLocalStorage()
        .then(() => cy.getSigninLink(defaultUser.email))
        .then((link) => cy.visit(link));
      cy.contains(t(AuthTitle.ConfirmEmail));
      cy.getAttrWith("type", "email").type("wrong@gmail.com");
      cy.clickButton(t(ActionButton.Verify));
      cy.contains(t(AuthErrorMessage[AuthErrorCodes.INVALID_EMAIL]));
    });

    it("prompts user to confirm email if expected email and sign in email mismatch", () => {
      // since it's difficult to reproduce the invalid email sign in link landing
      // we need to resort to stubbing the response to test the expected behavior
      cy.interceptTimes(1, "POST", signInWithEmailLinkURL, (req) => {
        req.reply(400, createAuthReqError("INVALID_EMAIL"));
      });

      // get the login link as per usual
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      // wait for `check email` message to prevent race condition in the following assertions
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );

      // test langing to the auth page using different email than the one expected (test using stubbed behaviour)
      cy.getSigninLink(defaultUser.email).then((link) => cy.visit(link));
      cy.contains(t(AuthTitle.ConfirmEmail));
      cy.contains(t(AuthMessage.DifferentSignInEmail));
      // confirm sign in email and expect the login to be successful
      // as the intercept stub should only be aplicable on the first call
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(i18n.t(ActionButton.Verify));
      // expect to see admin page navigation on successful login
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });

    it("prompts user to resend email link if link expired or already used", () => {
      // since it's difficult to reproduce the invalid email sign in link landing
      // we need to resort to stubbing the response to test the expected behavior
      cy.interceptTimes(1, "POST", signInWithEmailLinkURL, (req) => {
        req.reply(400, createAuthReqError("EXPIRED_OOB_CODE"));
      });

      // get the login link as per usual
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(t(ActionButton.Send));
      // wait for `check email` message to prevent race condition in the following assertions
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );

      // test landing to the auth page using invalidated oob code (test using stubbed behaviour)
      cy.getSigninLink(defaultUser.email).then((link) => cy.visit(link));
      cy.contains(t(AuthTitle.ResendEmail));
      cy.contains(t(AuthMessage.ResendEmailLink));
      // confirm resend email and log in successfully
      cy.getAttrWith("type", "email").type(defaultUser.email);
      cy.clickButton(i18n.t(ActionButton.Resend));
      cy.contains(
        t(AuthMessage.CheckSignInEmail, { email: defaultUser.email })
      );

      // expect to see admin page navigation on successful login
      cy.getSigninLink(defaultUser.email).then((link) => cy.visit(link));
      cy.getAttrWith("aria-label", t(AdminAria.PageNav));
    });
  });

  describe("Login redirect", () => {
    it("Redirects to customer bookings page on customer (non-admin) login", () => {
      const password = "password";
      cy.addAuthUser({ email: saul.email, password });
      // log in saul, who is not an admin, but exists in customers collection
      cy.clickButton(t(AuthTitle.SignInWithEmail));
      cy.getAttrWith("type", "email").type(saul.email);
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(AuthTitle.SignIn));
      cy.getAttrWith("type", "password").type(password);
      cy.clickButton(t(ActionButton.SignIn));
      // on successful login, should redirect to saul's customer bookings
      cy.url().should("include", saul.secretKey);
      cy.contains(`${saul.name} ${saul.surname}`);
    });

    it("redirects to non-registered page if user not admin, nor a registered customer", () => {
      const email = "new-user@gmail.com";
      const password = "password";
      cy.addAuthUser({ email, password });
      // log in saul, who is not an admin, but exists in customers collection
      cy.clickButton(t(AuthTitle.SignInWithEmail));
      cy.getAttrWith("type", "email").type(email);
      cy.clickButton(t(ActionButton.Next));
      cy.contains(t(AuthTitle.SignIn));
      cy.getAttrWith("type", "password").type(password);
      cy.clickButton(t(ActionButton.SignIn));
      // on successful login, should redirect to not-registered page
      // the user is not admin and doesn't exist in customers collection
      cy.contains(t(AuthMessage.NotRegistered));
      cy.contains(
        t(AuthMessage.ContactAdminsForRegistration, {
          authString: email,
          authMethod: "email",
          organizationEmail: "test@email.com",
        })
      );
    });
  });
});

const signInWithEmailLinkURL =
  "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink?key=api-key";

/**
 * A helper used to construct firebase auth error,
 * for cy.intercept stubbing
 * @param message authErrorCode (i.e. IVNALID_EMA)
 */
const createAuthReqError = (message: keyof typeof AuthErrorCodes) => ({
  error: {
    code: 400,
    message,
    errors: [
      {
        message,
        reason: "invalid",
        domain: "global",
      },
    ],
  },
});
