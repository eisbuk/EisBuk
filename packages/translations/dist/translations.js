"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alerts = exports.SlotFormAria = exports.AdminAria = exports.DateFormat = exports.Flags = exports.BookingCountdownMessage = exports.NotificationMessage = exports.BirthdayMenu = exports.ActionButton = exports.Prompt = exports.OrganizationLabel = exports.ValidationMessage = exports.CustomerLabel = exports.SlotFormLabel = exports.SlotFormTitle = exports.CustomerFormTitle = exports.CategoryLabel = exports.SlotTypeLabel = exports.AuthTitle = exports.AuthErrorMessage = exports.AuthMessage = exports.CustomerNavigationLabel = exports.NavigationLabel = void 0;
const shared_1 = require("@eisbuk/shared");
// #region navigation
var NavigationLabel;
(function (NavigationLabel) {
    NavigationLabel["Attendance"] = "NavigationLabel.Attendance";
    NavigationLabel["Athletes"] = "NavigationLabel.Athletes";
    NavigationLabel["Bookings"] = "NavigationLabel.Bookings";
})(NavigationLabel = exports.NavigationLabel || (exports.NavigationLabel = {}));
var CustomerNavigationLabel;
(function (CustomerNavigationLabel) {
    CustomerNavigationLabel["book_ice"] = "CustomerNavigation.BookIce";
    CustomerNavigationLabel["book_off_ice"] = "CustomerNavigation.BookOffIce";
    CustomerNavigationLabel["calendar"] = "CustomerNavigation.Calendar";
})(CustomerNavigationLabel = exports.CustomerNavigationLabel || (exports.CustomerNavigationLabel = {}));
// #endregion navigation
// #region auth
var AuthMessage;
(function (AuthMessage) {
    AuthMessage["NotAuthorized"] = "Authorization.NotAuthorized";
    AuthMessage["AdminsOnly"] = "Authorization.AdminsOnly";
    AuthMessage["LoggedInWith"] = "Authorization.LoggedInWith";
    AuthMessage["TryAgain"] = "Authorization.TryAgain";
    AuthMessage["RecoverEmailPassword"] = "Authorization.RecoverEmailPassword";
    AuthMessage["CheckPasswordRecoverEmail"] = "Authorization.CheckPasswordRecoverEmail";
    AuthMessage["CheckSignInEmail"] = "Authorization.CheckSignInEmail";
    AuthMessage["ConfirmSignInEmail"] = "Authorization.ConfirmSignInEmail";
    AuthMessage["SMSDataRatesMayApply"] = "Authorization.SMSDataRatesMayApply";
})(AuthMessage = exports.AuthMessage || (exports.AuthMessage = {}));
var AuthErrorMessage;
(function (AuthErrorMessage) {
    AuthErrorMessage["NETWORK_ERROR"] = "AuthError.NetworkError";
    AuthErrorMessage["auth/user-not-found"] = "AuthError.EmailNotFound";
    AuthErrorMessage["auth/wrong-password"] = "AuthError.InvalidPassword";
    AuthErrorMessage["auth/invalid-verification-code"] = "AuthError.InvalidVerificationCode";
    AuthErrorMessage["auth/invalid-email"] = "AuthError.InvalidEmail";
    AuthErrorMessage["UNKNOWN"] = "AuthError.Unknown";
})(AuthErrorMessage = exports.AuthErrorMessage || (exports.AuthErrorMessage = {}));
var AuthTitle;
(function (AuthTitle) {
    AuthTitle["SignInWithEmail"] = "AuthTitle.SignInWithEmail";
    AuthTitle["SignInWithEmailLink"] = "AuthTitle.SignInWithEmailLink";
    AuthTitle["SignInWithPhone"] = "AuthTitle.SignInWithPhone";
    AuthTitle["SignInWithGoogle"] = "AuthTitle.SignInWithGoogle";
    AuthTitle["SignIn"] = "AuthTitle.SignIn";
    AuthTitle["SendSignInLink"] = "AuthTitle.SendSignInLink";
    AuthTitle["CreateAccount"] = "AuthTitle.CreateAccount";
    AuthTitle["RecoverPassword"] = "AuthTitle.RecoverPassword";
    AuthTitle["CheckYourEmail"] = "AuthTitle.CheckYourEmail";
    AuthTitle["ConfirmEmail"] = "AuthTitle.ConfirmEmail";
    AuthTitle["EnterCode"] = "AuthTitle.EnterCode";
})(AuthTitle = exports.AuthTitle || (exports.AuthTitle = {}));
// #endregion auth
// #region dataEntries
exports.SlotTypeLabel = {
    [shared_1.SlotType.Ice]: "SlotType.Ice",
    [shared_1.SlotType.OffIce]: "SlotType.OffIce",
};
exports.CategoryLabel = {
    [shared_1.Category.Adults]: "Category.Adults",
    [shared_1.Category.PreCompetitive]: "Category.PreCompetitive",
    [shared_1.Category.Competitive]: "Category.Competitive",
    [shared_1.Category.Course]: "Category.Course",
};
// #endregion dataEntries
// #region forms
var CustomerFormTitle;
(function (CustomerFormTitle) {
    CustomerFormTitle["NewCustomer"] = "FormTitle.NewCustomer";
    CustomerFormTitle["EditCustomer"] = "FormTitle.EditCustomer";
})(CustomerFormTitle = exports.CustomerFormTitle || (exports.CustomerFormTitle = {}));
var SlotFormTitle;
(function (SlotFormTitle) {
    SlotFormTitle["NewSlot"] = "FormTitle.NewSlot";
    SlotFormTitle["EditSlot"] = "FormTitle.EditSlot";
})(SlotFormTitle = exports.SlotFormTitle || (exports.SlotFormTitle = {}));
var SlotFormLabel;
(function (SlotFormLabel) {
    SlotFormLabel["Type"] = "SlotForm.Type";
    SlotFormLabel["Categories"] = "SlotForm.Categories";
    SlotFormLabel["Intervals"] = "SlotForm.Intervals";
    SlotFormLabel["AddInterval"] = "SlotForm.AddInterval";
    SlotFormLabel["StartTime"] = "SlotForm.StartTime";
    SlotFormLabel["EndTime"] = "SlotForm.EndTime";
})(SlotFormLabel = exports.SlotFormLabel || (exports.SlotFormLabel = {}));
var CustomerLabel;
(function (CustomerLabel) {
    CustomerLabel["Name"] = "CustomerLabel.Name";
    CustomerLabel["Surname"] = "CustomerLabel.Surname";
    CustomerLabel["Category"] = "CustomerLabel.Category";
    CustomerLabel["Email"] = "CustomerLabel.Email";
    CustomerLabel["Phone"] = "CustomerLabel.Phone";
    CustomerLabel["Birthday"] = "CustomerLabel.DateOfBirth";
    CustomerLabel["CertificateExpiration"] = "CustomerLabel.MedicalCertificate";
    CustomerLabel["CardNumber"] = "CustomerLabel.CardNumber";
    CustomerLabel["CovidCertificateReleaseDate"] = "CustomerLabel.CovidCertificateReleaseDate";
    CustomerLabel["CovidCertificateSuspended"] = "CustomerLabel.CovidCertificateSuspended";
    CustomerLabel["ExtendedBookingDate"] = "CustomerLabel.ExtendedBookingDate";
})(CustomerLabel = exports.CustomerLabel || (exports.CustomerLabel = {}));
var ValidationMessage;
(function (ValidationMessage) {
    ValidationMessage["Email"] = "Validations.Email";
    ValidationMessage["RequiredEntry"] = "Validations.RequiredEntry";
    ValidationMessage["RequiredField"] = "Validations.RequiredField";
    ValidationMessage["InvalidTime"] = "Validations.InvalidTime";
    ValidationMessage["InvalidDate"] = "Validations.InvalidDate";
    ValidationMessage["InvalidPhone"] = "Validations.InvalidPhone";
    ValidationMessage["TimeMismatch"] = "Validations.TimeMismatch";
    ValidationMessage["WeakPassword"] = "Validations.WeakPassword";
    ValidationMessage["InvalidSmsFrom"] = "Validations.InvalidSmsFrom";
    ValidationMessage["InvalidSmsFromLength"] = "Validations.InvalidSmsFromLength";
})(ValidationMessage = exports.ValidationMessage || (exports.ValidationMessage = {}));
var OrganizationLabel;
(function (OrganizationLabel) {
    OrganizationLabel["EmailNameFrom"] = "OrganizationLabel.EmailNameFrom";
    OrganizationLabel["EmailFrom"] = "OrganizationLabel.EmailFrom";
    OrganizationLabel["EmailTemplate"] = "OrganizationLabel.EmailTemplate";
    OrganizationLabel["SmsFrom"] = "OrganizationLabel.SmsFrom";
    OrganizationLabel["SmsTemplate"] = "OrganizationLabel.SmsTemplate";
    OrganizationLabel["DisplayName"] = "OrganizationLabel.DisplayName";
    OrganizationLabel["Admins"] = "OrganizationLabel.Admins";
    OrganizationLabel["AddNewAdmin"] = "OrganizationLabel.AddNewAdmin";
})(OrganizationLabel = exports.OrganizationLabel || (exports.OrganizationLabel = {}));
// #endregion forms
// #region dialog
var Prompt;
(function (Prompt) {
    Prompt["DeleteCustomer"] = "Prompt.DeleteCustomer";
    Prompt["DeleteSlot"] = "Prompt.DeleteSlot";
    Prompt["NonReversible"] = "Prompt.NonReversible";
    Prompt["SendEmailTitle"] = "Prompt.SendEmailTitle";
    Prompt["ConfirmEmail"] = "Prompt.ConfirmEmail";
    Prompt["SendSMSTitle"] = "Prompt.SendSMSTitle";
    Prompt["ConfirmSMS"] = "Prompt.ConfirmSMS";
    Prompt["ExtendBookingDateTitle"] = "Prompt.ExtendBookingDateTitle";
    Prompt["ExtendBookingDateBody"] = "Prompt.ExtendBookingDateBody";
    Prompt["FinalizeBookingsTitle"] = "Prompt.FinalizeBookingsTitle";
    Prompt["ConfirmFinalizeBookings"] = "Prompt.ConfirmFinalizeBookings";
})(Prompt = exports.Prompt || (exports.Prompt = {}));
var ActionButton;
(function (ActionButton) {
    ActionButton["SignIn"] = "ActionButton.SignIn";
    ActionButton["TroubleSigningIn"] = "ActionButton.TroubleSigningIn";
    ActionButton["CreateSlot"] = "ActionButton.CreateSlot";
    ActionButton["EditSlot"] = "ActionButton.EditSlot";
    ActionButton["AddAthlete"] = "ActionButton.AddAthlete";
    ActionButton["AddCustomers"] = "ActionButton.AddCustomers";
    ActionButton["BookInterval"] = "ActionButton.BookInterval";
    ActionButton["FinalizeBookings"] = "ActionButton.FinalizeBookings";
    ActionButton["CustomerBookings"] = "ActionButton.CustomerBookings";
    ActionButton["SendBookingsEmail"] = "ActionButton.SendBookingsEmail";
    ActionButton["SendBookingsSMS"] = "ActionButton.SendBookingsSMS";
    ActionButton["ExtendBookingDate"] = "ActionButton.ExtendBookingDate";
    ActionButton["Save"] = "ActionButton.Save";
    ActionButton["Next"] = "ActionButton.Next";
    ActionButton["Cancel"] = "ActionButton.Cancel";
    ActionButton["ShowAll"] = "ActionButton.ShowAll";
    ActionButton["Done"] = "ActionButton.Done";
    ActionButton["Send"] = "ActionButton.Send";
    ActionButton["Dismiss"] = "ActionButton.Dismiss";
    ActionButton["Submit"] = "ActionButton.Submit";
    ActionButton["Verify"] = "ActionButton.Verify";
    ActionButton["Add"] = "ActionButton.Add";
})(ActionButton = exports.ActionButton || (exports.ActionButton = {}));
// #endregion dialog
// #region birthdayMenu
var BirthdayMenu;
(function (BirthdayMenu) {
    BirthdayMenu["ShowAll"] = "BirthdayMenu.ShowAll";
    BirthdayMenu["UpcomingBirthdays"] = "BirthdayMenu.UpcomingBirthdays";
})(BirthdayMenu = exports.BirthdayMenu || (exports.BirthdayMenu = {}));
// #endregion birthdayMenu
// #region notifications
var NotificationMessage;
(function (NotificationMessage) {
    NotificationMessage["BookingSuccess"] = "Notification.BookingSuccess";
    NotificationMessage["BookingCanceled"] = "Notification.BookingCanceled";
    NotificationMessage["BookingCanceledError"] = "Notification.BookingCanceledError";
    NotificationMessage["SlotAdded"] = "Notification.SlotAdded";
    NotificationMessage["SlotUpdated"] = "Notification.SlotUpdated";
    NotificationMessage["SlotDeleted"] = "Notification.SlotRemoved";
    NotificationMessage["LogoutSuccess"] = "Notification.LogoutSuccess";
    NotificationMessage["LogoutError"] = "Notification.LogoutError";
    NotificationMessage["Updated"] = "Notification.Updated";
    NotificationMessage["Removed"] = "Notification.Removed";
    NotificationMessage["EmailSent"] = "Notification.EmailSent";
    NotificationMessage["SMSSent"] = "Notification.SMSSent";
    NotificationMessage["BookingDateExtended"] = "Notification.BookingdateExtended";
    NotificationMessage["Error"] = "Notification.Error";
})(NotificationMessage = exports.NotificationMessage || (exports.NotificationMessage = {}));
var BookingCountdownMessage;
(function (BookingCountdownMessage) {
    BookingCountdownMessage["FirstDeadline"] = "BookingCountdownMessage.FirstDeadline";
    BookingCountdownMessage["SecondDeadline"] = "BookingCountdownMessage.SecondDeadline";
    BookingCountdownMessage["BookingsLocked"] = "BookingCountdownMessage.BookingsLocked";
})(BookingCountdownMessage = exports.BookingCountdownMessage || (exports.BookingCountdownMessage = {}));
// #endregion notifications
// #region flags
var Flags;
(function (Flags) {
    Flags["Deleted"] = "Flags.Deleted";
})(Flags = exports.Flags || (exports.Flags = {}));
// #endregion flags
// #region date
var DateFormat;
(function (DateFormat) {
    DateFormat["Weekday"] = "Date.Weekday";
    DateFormat["Day"] = "Date.Day";
    DateFormat["Month"] = "Date.Month";
    DateFormat["Full"] = "Date.Full";
    DateFormat["DayMonth"] = "Date.DayMonth";
    DateFormat["MonthYear"] = "Date.MonthYear";
    DateFormat["Time"] = "Date.Time";
    DateFormat["Placeholder"] = "Date.Placeholder";
    DateFormat["Today"] = "Date.Today";
})(DateFormat = exports.DateFormat || (exports.DateFormat = {}));
// #endregion date
// #region aria-labels
var AdminAria;
(function (AdminAria) {
    AdminAria["PageNav"] = "AdminAria.PageNav";
    AdminAria["SeePastDates"] = "AdminAria.SeePastDates";
    AdminAria["SeeFutureDates"] = "AdminAria.SeeFutureDates";
    AdminAria["ToggleSlotOperations"] = "AdminAria.ToggleSlotOperations";
    AdminAria["CopySlots"] = "AdminAria.CopySlots";
    AdminAria["PasteSlots"] = "AdminAria.PasteSlots";
    AdminAria["CreateSlots"] = "AdminAria.CreateSlots";
})(AdminAria = exports.AdminAria || (exports.AdminAria = {}));
var SlotFormAria;
(function (SlotFormAria) {
    SlotFormAria["SlotCategory"] = "SlotFormAria.SlotCategory";
    SlotFormAria["SlotType"] = "SlotFormAria.SlotType";
    SlotFormAria["AddInterval"] = "SlotFormAria.AddInterval";
    SlotFormAria["IntervalStart"] = "SlotFormAria.IntervalStart";
    SlotFormAria["IntervalEnd"] = "SlotFormAria.IntervalEnd";
    SlotFormAria["DeleteInterval"] = "SlotFormAria.DeleteInterval";
    SlotFormAria["SlotNotes"] = "SlotFormAria.SlotNotes";
    SlotFormAria["CancelSlot"] = "SlotFormAria.CancelSlot";
    SlotFormAria["ConfirmCreateSlot"] = "SlotFormAria.ConfirmCreateSlot";
    SlotFormAria["ConfirmEditSlot"] = "SlotFormAria.ConfirmEditSlot";
})(SlotFormAria = exports.SlotFormAria || (exports.SlotFormAria = {}));
// #endregion aria-labels
// #region alerts
var Alerts;
(function (Alerts) {
    Alerts["NoSlots"] = "Alerts.NoSlots";
})(Alerts = exports.Alerts || (exports.Alerts = {}));
// #endregion alerts
//# sourceMappingURL=translations.js.map