export declare enum HTTPSErrors {
    NoPayload = "No request payload provided",
    Unauth = "Unathorized",
    TimedOut = "Function timed out",
    MissingParameter = "One or more required parameters are missing from the payload",
    NoOrganziation = "No argument for organization provided"
}
export declare enum SendSMSErrors {
    SendingFailed = "SMS sending failed on provider's side. Check the details."
}
export declare enum BookingsErrors {
    NoCustomerId = "No customer id provided",
    NoSecretKey = "No secret key provided",
    SecretKeyMismatch = "Invalid secret key",
    CustomerNotFound = "Customer not found"
}
