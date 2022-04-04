# Firebase Auth

As of now, we support four auth flows:

1. sign in with google:

- the simplest flow we're utilizing. All of the auth logic is handled by firebase's `signInWithRedirect` using `GoogleAuthProvider` (both imported from firebase).

2. email/password auth
3. email/link auth
4. phone/sms-code auth

All auth flows, except for Google, have their own UI component integrating the UI steps with appropriate Firebase flow. Each of the UI flows are explained below.

**All UI flow components utilize `useAuthFlow` hook for firebase communication and error handling** _[see more](hooks/README.md#useauthflow)_

## Email/password auth

Email/password singin/signup is handled through `EmailFlow`. The steps of email/password flow are as follows:

### 1 Sign in with email

The initial step of email/password flow, user is prompted with email input which is the checked to determine sign-in/sign-up based on the email.

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Next - runs a `handleSubmit` - checks available signin methods using `fetchSignInMethodsForEmail`:

  - if "password" included in sign methods, continues with **sign in** flow ([2.1](#21-sign-in-with-email-password))
  - if sign in methods empty, continues with **sign up** flow ([2.2](#22-create-account-email-password))

### 2.1 Sign in with email password

Second step of email/password **sign in** flow, user is prompted with password input which is then used to finalize firebase sign in.

**Input fields:**

- email
- password

**Action buttons:**

- Trouble signing in? - redirects to password recovery step
- Signin - runs a `handleSubmit` - performs `signInWithEmailAndPassword`:

  - if successfull, the user is signed id
  - if error, displays the error

### 2.2 Create account email password

Second step of email/password **sign up** flow, user is prompted with name/surname and desired password inputs which are then used to finalize firebase sign up.

**Input fields:**

- email
- name (currently required but not used)
- password

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Save - runs a `handleSubmit` - performs `createUserWithEmailAndPassword`:

  - if successfull, the user is created and signed in
  - if error, displays the error

### 3 Recover email password

Optional step of email auth, available only to users already registered with email, prompts user to send password recovery email.

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Send - runs a `handleSubmit` - performs `sendPasswordResetEmail`:
  - if successfull, continues to check password recover email ([4](#4-check-password-recover-email))
  - if error, displays the error

### 4 Check password recover email

Final step of password recovery, shows 'check-your-email' message:

**Input fields:**

/_ None _/

**Action buttons:**

- Done - reverts back to initial auth dialog with auth method choice

## Email/link auth

Email/password signup is handled through `EmailLinkFlow`. The email link flow handles both the sending of the email link (be it for sign-in or sign-up), as well as handling the landing to the page using the link received through email.
The steps of email/link flow are as follows:

### 1 Send sign in link

The initial step of the email/link flow, prompts user with email input and sends login email to the provided address.

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Send - runs a `handleSubmit` - runs `sendSignInLinkToEmail`:
  - on success, stores email to `localStorage` as `"emailForSignIn"` and shows a message to user to check their email
  - on error, displays an error message

### 2 Check sign in email

Displays a message confirming that the link has been sent to the provided email (and displays the email address).

**Input fields:**

/_ None _/

**Action buttons:**

- Done - reverts back to initial auth dialog with auth method choice

### 3 Sign in link landing:

This is not an auth step per se, as the check is done on mount and according to the link/email check, user is either signed in seamlessly or redirected to one of the following auth steps:

### 3.1 Confirm sign in email

Used when no `"emailForSignIn"` is found in the `localStorage`, prompts the user to confirm the email used to receive the signin link:

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Verify - runs a `handleSubmit` - runs `signInWithEmailLink`:

  - on success, the user is signed in
  - on error, displays an error message

### 3.2 Different sign in email

Similar to the [3.1](#31-confirm-sign-in-email), when `"emailForSignIn"` in `localStorage` and email used to receive the signin link mismatch, prompts the user to confirm the email used to receive the signin link.

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Verify - runs a `handleSubmit` - runs `signInWithEmailLink`:

  - on success, the user is signed in
  - on error, displays an error message

### 3.3 Resend email link

If link used to sign in is expired or used already, prompts the user to, similarly to [1](#1-send-sign-in-link), send the new signin link.

**Input fields:**

- email

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Resend - runs a `handleSubmit` - runs `sendSignInLinkToEmail`:
  - on success, stores email to `localStorage` as `"emailForSignIn"` and shows a message to user to check their email
  - on error, displays an error message

## Phone/SMS-code auth

Phone/sms-code auth is handled through `PhoneAuthFlow`. The steps of phone/sms-code auth are as follows:

### 1 Sign in with phone

The user is presented with the prompt to enter the phone number (for sign in/sign up) to which the code is sent via SMS

**Input fields:**

- phone

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Verify - runs a `handleSubmit` - initializes the new reCaptcha verifier (tries with invisible reCaptcha and shows the puzzle only if necessary), after successful reCaptcha check, runs `signInWithPhoneNumber` sending the SMS Code to the provided number:

  - on success, redirects to ``
  - on error, displays an error message

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - attempts to perform invisible reCaptcha verification (or presents the user with recaptcha quiz), upon which the SMS code is sent and redirects to step [2](#2-sms-code)

### 2 SMS code

Displays a message confirming that the code has been successfully sent and writes out the phone number the code has been sent to. Prompts user with SMS code input which is then used to sign into the app.

**Input fields:**

- code

**Action buttons:**

- Code not received - redirects to code resend SMS prompt ([3](#3-resend-sms))
- Submit - runs a `handleSubmit` - checks code using `recaptchaVerifier.verify(code)`

  - on success, user is signed in
  - on error, displays an error message

### 3 Resend SMS

Prompts user to resend SMS if the code not received.

**Input fields:**

/_ None _/

**Action buttons:**

- Cancel - reverts back to initial auth dialog with auth method choice
- Resend - runs a `handleSubmit` - uses the phone number (already stored in local state) to, similarly to [1](#1-send-sign-in-link) go through a new reCaptcha process and resend the code
