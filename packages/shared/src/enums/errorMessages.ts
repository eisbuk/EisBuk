// #region cloudFunctions
export enum HTTPSErrors {
  NoPayload = "No request payload provided",
  Unauth = "Unathorized",
  TimedOut = "Function timed out",
  MissingParameter = "One or more required parameters are missing from the payload",
  NoOrganziation = "No argument for organization provided",
  NoConfiguration = "A required configuration has not been provided for this organization",
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
