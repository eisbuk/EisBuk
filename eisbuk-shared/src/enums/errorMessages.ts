// #region cloudFunctions
export enum HTTPSErrors {
  NoPayload = "No request payload provided",
  Unauth = "Unathorized",
  TimedOut = "Function timed out",
  MissingParameter = "One or more required parameters are missing from the payloady",
}

export enum SendSMSErrors {
  NoProviderURL = "No URL for SMS sending service provider found, add your SMS service provider URL to 'smsConfig.url' for organization",
  NoAuthToken = "No auth token for SMS sending service provider found, add your SMS service provider auth token 'smsConfig.authToken' for organization",
  SendingFailed = "SMS sending failed on provider's side. Check the details.",
}
// #endregion cloudFunctions
