// #region cloudFunctions
export enum HTTPSErrors {
  NoPayload = "No request payload provided",
  Unauth = "Unathorized",
  TimedOut = "Function timed out",
  MissingParameter = "One or more required parameters are missing from the payload",
  EmailInvalidType = "Email type missing or invalid",
  SMSInvalidType = "SMS type missing or invalid",
  NoOrganziation = "No argument for organization provided",
  NoSecrets = "No secrets document found, make sure to create a secrets document for an organziation at: '/secrets/{ organization }'",
  NoSMTPConfigured = "No smtp configuration found, make sure to create a secrets document for an organziation at: '/secrets/{ organization }' with your smtp configuration",
  NoEmailConfigured = "No emailFrom found, make sure to add an emailFrom to your organziation settings",
  SelfRegInvalidCode = "Unathorized: Invalid registration code code",
}

export enum SendSMSErrors {
  SendingFailed = "SMS sending failed on provider's side. Check the details.",
}

export enum BookingsErrors {
  NoCustomerId = "No customer id provided",
  NoSecretKey = "No secret key provided",
  SecretKeyMismatch = "Invalid secret key",
  CustomerNotFound = "Customer not found",
}
// #endregion cloudFunctions
