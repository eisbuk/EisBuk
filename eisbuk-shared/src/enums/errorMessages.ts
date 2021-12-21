// #region cloudFunctions
export enum HTTPErrors {
  NoPayload = "No request payload provided",
}

export enum SendEmailErrors {
  NoOrganziation = "No argument for organization provided",
  NoRecipient = "No recipient specified",
  NoMsgBody = "Message body (html) not provided",
  NoSubject = "No email subject specified",
}
// #endregion cloudFunctions
