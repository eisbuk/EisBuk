// #region authSteps
/**
 * Enum containing values for all possible views of email/password auth flow
 */
export enum EmailAuthStep {
  /** Email/Password initial view (only email prompt) */
  SignInWithEmail = "SignInWithEmail",
  /** Email/Password password prompt (after email verified as registered) */
  SignInWithEmailPassword = "SignInWithEmailPassword",
  /** Email/Password sign up view (after email verified as valid, but not registered) */
  CreateAccountEmailPassword = "CreateAccountEmailPassword",
  /** Email/Password help message (after `Trouble signing in?` click) */
  RecoverEmailPassword = "RecoverEmailPassword",
  /** Email/Password 'Check your email' message (after sending reset password email) */
  CheckPasswordRecoverEmail = "CheckPasswordRecoverEmail",
}

/**
 * Enum containing values for all possible views of email link auth flow
 */
export enum EmailLinkAuthStep {
  /** Email link initial view (email prompt) */
  SendSignInLink = "SendSignInLink",
  /** Email link 'Check your email' message (after sending sign link) */
  CheckSignInEmail = "CheckSignInEmail",
  /** Email link 'Confirm email' prompt (if isSignInWithEmaiLink, but email doesn't exist in local storage) */
  ConfirmSignInEmail = "ConfirmSignInEmail",
  /** Email link 'Confirm email' prompt (if isSignInWithEmaiLink, but email in localStorage doesn't match the sign in link email) */
  DifferentSignInEmail = "DifferentSignInEmail",
  /** Email link 'Resend email' prompt (if landing using expired or used email link, prompt user to resend email link) */
  ResendEmailLink = "ResendEmailLink",
}

/**
 * Enum containing values for all possible views of phone auth flow
 */
export enum PhoneAuthStep {
  /** Phone initial view (only phone prompt) */
  SignInWithPhone = "SignInWithPhone",
  /** Phone confirmation view (SMS code input) */
  SMSCode = "SMSCode",
}
// #endregion authSteps
