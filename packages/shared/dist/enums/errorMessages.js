"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsErrors = exports.SendSMSErrors = exports.HTTPSErrors = void 0;
// #region cloudFunctions
var HTTPSErrors;
(function (HTTPSErrors) {
    HTTPSErrors["NoPayload"] = "No request payload provided";
    HTTPSErrors["Unauth"] = "Unathorized";
    HTTPSErrors["TimedOut"] = "Function timed out";
    HTTPSErrors["MissingParameter"] = "One or more required parameters are missing from the payload";
    HTTPSErrors["NoOrganziation"] = "No argument for organization provided";
})(HTTPSErrors = exports.HTTPSErrors || (exports.HTTPSErrors = {}));
var SendSMSErrors;
(function (SendSMSErrors) {
    SendSMSErrors["SendingFailed"] = "SMS sending failed on provider's side. Check the details.";
})(SendSMSErrors = exports.SendSMSErrors || (exports.SendSMSErrors = {}));
var BookingsErrors;
(function (BookingsErrors) {
    BookingsErrors["NoCustomerId"] = "No customer id provided";
    BookingsErrors["NoSecretKey"] = "No secret key provided";
    BookingsErrors["SecretKeyMismatch"] = "Invalid secret key";
    BookingsErrors["CustomerNotFound"] = "Customer not found";
})(BookingsErrors = exports.BookingsErrors || (exports.BookingsErrors = {}));
// #endregion cloudFunctions
//# sourceMappingURL=errorMessages.js.map