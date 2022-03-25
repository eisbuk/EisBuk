# Auth UI

As of now, we support three auth UI flows:

- email/password auth
- email/link auth - handled by `EmailLinkFlow`
- phone/sms-code auth - handled by `PhoneFlow`

**All of the above-mentioned flows utilize `useAuthFlow` hook which provides a convenient way of paginating through auth steps (keeps the internal state and provides a `setAuthStep` setter) and a wrapper around submit handler, used to provide error handling in a specified way. Additionally the `dialogError` is returned from the hook (for all errors to be displayed in the dialog) whereas the errors specified as field errors are set to formik context using `handleSubmit` params, passed to the submit wrapper**

_note: 3rd party flows, such as Google signin are handled through the `AuthDialog` component itsef as they're quite straight forward and don't require additional UI_

## Email/password auth

Email/password signup is handled through `EmailFlow`. The steps of email/password flow are as follows:

1. Sign in with email - initial step of email/password flow, user is prompted with email input which is the checked to determine sign-in/sign-up based on the email:

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - checks available signin methods for email, if "password" included, continues with **sign in** flow (`2.1.`), otherwise continues with **sign up** flow (`2.2.`)

  2.1. Sign in with email password - second step of email/password **sign in** flow, user is prompted with password input which is then used to finalize firebase sign in:

  - onReset - there is no 'cancel' button on this step, but there is, however, `Trouble signing in?` button which redirects to password reset flow (`3.`)
  - onSubmit - performs firebase's `signInWithEmailAndPassword` using form provided email and password

    2.2. Create account email password - second step of email/password **sign up** flow, user is prompted with name/surname and desired password inputs which are then used to finalize firebase sign up:

  - onReset - reverts back to initial auth dialog with auth method choice
  - onSubmit - performs firebase's `createUserWithEmailAndPassword` using form provided email and password (currently name/surname input field is not utilized)

3. Recover email password - optional step of email auth, available only to users already registered with email, prompts user to send password recovery email:

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - sends password recovery email and redirects to check-email message (`4.`)

4. Check password recover email - final step of password recovery, shows 'check-your-email' message:

- onSubmit - reverts back to initial auth dialog with auth method choice

## Email/link auth

Email/password signup is handled through `EmailLinkFlow`. The email link flow handles both the sending of the email link (be it for sign in or sign up), as well as handling the landing to the page using the link received through email.
The steps of email/link flow are as follows:

1. Send sign in link - initial step of the email/link flow, prompts user with email input and sends login email to the provided address:

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - stores the provided email to `localStorage` as `"emailForSignIn"` for use with login link landing, shows check-sign-in-email message (`2.`)

2. Check sign in email - displays a message to check the email for sent out signin link

- onSubmit - reverts back to initial auth dialog with auth method choice

#### Sign in link landing:

This is not an auth step per se, as the check is done on mount and according to the link/email check, user is either signed in seamlessly or redirected to one of the following auth steps:

3.1. Confirm sign in email - used when no `"emailForSignIn"` is found in the `localStorage`, prompts the user to confirm the email used to receive the signin link:

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - attempts to verify the email provided (as the email used to receive the signin link)

  3.2. Different sign in email - similar to the `3.1.`, when `"emailForSignIn"` in `localStorage` and email used to receive the signin link mismatch, prompts the user to confirm the email used to receive the signin link:

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - attempts to verify the email provided (as the email used to receive the signin link)

  3.3. Resend email link - if link used to sign in is expired or used already, prompts the user to, similarly to `1.` sends the new signin link and stores the email to local storage

## Phone/SMS-code auth

Phone/sms-code auth is handled through `PhoneAuth`. The steps of phone/sms-code auth are as follows:

1. Sign in with phone - user is presented with the prompt to enter the phone number (for sign in/sign up) to which the code is sent via SMS

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - attempts to perform invisible reCaptcha verification (or presents the user with recaptcha quiz), upon which the SMS code is sent and redirects to step `2.`

2. SMS code - prompts user with SMS code input which is then used to sign into the app

- onReset - reverts back to initial auth dialog with auth method choice
- onSubmit - attempts to verify the code and sign in
