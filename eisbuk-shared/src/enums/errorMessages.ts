// #region cloudFunctions
export enum HTTPErrors {
  NoPayload = "No request payload provided",
  Unauth = "Unathorized",
}

export enum SendEmailErrors {
  NoOrganziation = "No argument for organization provided",
  NoRecipient = "No recipient email specified",
  NoMsgBody = "Message body (html) not provided",
  NoSubject = "No email subject specified",
}

export enum SendSMSErrors {
  NoRecipient = "No recipient phone number specified",
  NoMsgBody = "Message body not provided",
  NoProviderURL = "No URL for SMS sending service provider found, add your SMS service provider URL to 'smsConfig.url' for organization",
  NoAuthToken = "No auth token for SMS sending service provider found, add your SMS service provider auth token 'smsConfig.authToken' for organization",
}
// #endregion cloudFunctions
