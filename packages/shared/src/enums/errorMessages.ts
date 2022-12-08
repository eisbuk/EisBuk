// #region cloudFunctions
export enum HTTPSErrors {
  NoPayload = "No request payload provided",
  Unauth = "Unathorized",
  TimedOut = "Function timed out",
  MissingParameter = "One or more required parameters are missing from the payload",
  NoOrganziation = "No argument for organization provided",
  NoSecrets = "No secrets document found, make sure you create a secrets document for an organziation at: '/secrets/{ organization }'",
  NoSMTPConfigured = "No smtp configuration found, make sure you create a secrets document for an organziation at: '/secrets/{ organization }' with your smtp configuration",
  NoEmailConfigured = "No emailFrom found, make sure you add an emailFrom to the organziation document at: '/secrets/{ organization }'",
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
