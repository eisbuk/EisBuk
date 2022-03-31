export declare enum NavigationLabel {
    Attendance = "NavigationLabel.Attendance",
    Athletes = "NavigationLabel.Athletes",
    Bookings = "NavigationLabel.Bookings"
}
export declare enum CustomerNavigationLabel {
    "book_ice" = "CustomerNavigation.BookIce",
    "book_off_ice" = "CustomerNavigation.BookOffIce",
    "calendar" = "CustomerNavigation.Calendar"
}
export declare enum AuthMessage {
    NotAuthorized = "Authorization.NotAuthorized",
    AdminsOnly = "Authorization.AdminsOnly",
    LoggedInWith = "Authorization.LoggedInWith",
    TryAgain = "Authorization.TryAgain",
    RecoverEmailPassword = "Authorization.RecoverEmailPassword",
    CheckPasswordRecoverEmail = "Authorization.CheckPasswordRecoverEmail",
    CheckSignInEmail = "Authorization.CheckSignInEmail",
    ConfirmSignInEmail = "Authorization.ConfirmSignInEmail",
    SMSDataRatesMayApply = "Authorization.SMSDataRatesMayApply"
}
export declare enum AuthErrorMessage {
    NETWORK_ERROR = "AuthError.NetworkError",
    "auth/user-not-found" = "AuthError.EmailNotFound",
    "auth/wrong-password" = "AuthError.InvalidPassword",
    "auth/invalid-verification-code" = "AuthError.InvalidVerificationCode",
    "auth/invalid-email" = "AuthError.InvalidEmail",
    UNKNOWN = "AuthError.Unknown"
}
export declare enum AuthTitle {
    SignInWithEmail = "AuthTitle.SignInWithEmail",
    SignInWithEmailLink = "AuthTitle.SignInWithEmailLink",
    SignInWithPhone = "AuthTitle.SignInWithPhone",
    SignInWithGoogle = "AuthTitle.SignInWithGoogle",
    SignIn = "AuthTitle.SignIn",
    SendSignInLink = "AuthTitle.SendSignInLink",
    CreateAccount = "AuthTitle.CreateAccount",
    RecoverPassword = "AuthTitle.RecoverPassword",
    CheckYourEmail = "AuthTitle.CheckYourEmail",
    ConfirmEmail = "AuthTitle.ConfirmEmail",
    EnterCode = "AuthTitle.EnterCode"
}
export declare const SlotTypeLabel: {
    ice: string;
    "off-ice": string;
};
export declare const CategoryLabel: {
    adults: string;
    "pre-competitive": string;
    competitive: string;
    course: string;
};
export declare enum CustomerFormTitle {
    NewCustomer = "FormTitle.NewCustomer",
    EditCustomer = "FormTitle.EditCustomer"
}
export declare enum SlotFormTitle {
    NewSlot = "FormTitle.NewSlot",
    EditSlot = "FormTitle.EditSlot"
}
export declare enum SlotFormLabel {
    Type = "SlotForm.Type",
    Categories = "SlotForm.Categories",
    Intervals = "SlotForm.Intervals",
    AddInterval = "SlotForm.AddInterval",
    StartTime = "SlotForm.StartTime",
    EndTime = "SlotForm.EndTime"
}
export declare enum CustomerLabel {
    Name = "CustomerLabel.Name",
    Surname = "CustomerLabel.Surname",
    Category = "CustomerLabel.Category",
    Email = "CustomerLabel.Email",
    Phone = "CustomerLabel.Phone",
    Birthday = "CustomerLabel.DateOfBirth",
    CertificateExpiration = "CustomerLabel.MedicalCertificate",
    CardNumber = "CustomerLabel.CardNumber",
    CovidCertificateReleaseDate = "CustomerLabel.CovidCertificateReleaseDate",
    CovidCertificateSuspended = "CustomerLabel.CovidCertificateSuspended",
    ExtendedBookingDate = "CustomerLabel.ExtendedBookingDate"
}
export declare enum ValidationMessage {
    Email = "Validations.Email",
    RequiredEntry = "Validations.RequiredEntry",
    RequiredField = "Validations.RequiredField",
    InvalidTime = "Validations.InvalidTime",
    InvalidDate = "Validations.InvalidDate",
    InvalidPhone = "Validations.InvalidPhone",
    TimeMismatch = "Validations.TimeMismatch",
    WeakPassword = "Validations.WeakPassword",
    InvalidSmsFrom = "Validations.InvalidSmsFrom",
    InvalidSmsFromLength = "Validations.InvalidSmsFromLength"
}
export declare enum OrganizationLabel {
    EmailNameFrom = "OrganizationLabel.EmailNameFrom",
    EmailFrom = "OrganizationLabel.EmailFrom",
    EmailTemplate = "OrganizationLabel.EmailTemplate",
    SmsFrom = "OrganizationLabel.SmsFrom",
    SmsTemplate = "OrganizationLabel.SmsTemplate",
    DisplayName = "OrganizationLabel.DisplayName",
    Admins = "OrganizationLabel.Admins",
    AddNewAdmin = "OrganizationLabel.AddNewAdmin"
}
export declare enum Prompt {
    DeleteCustomer = "Prompt.DeleteCustomer",
    DeleteSlot = "Prompt.DeleteSlot",
    NonReversible = "Prompt.NonReversible",
    SendEmailTitle = "Prompt.SendEmailTitle",
    ConfirmEmail = "Prompt.ConfirmEmail",
    SendSMSTitle = "Prompt.SendSMSTitle",
    ConfirmSMS = "Prompt.ConfirmSMS",
    ExtendBookingDateTitle = "Prompt.ExtendBookingDateTitle",
    ExtendBookingDateBody = "Prompt.ExtendBookingDateBody",
    FinalizeBookingsTitle = "Prompt.FinalizeBookingsTitle",
    ConfirmFinalizeBookings = "Prompt.ConfirmFinalizeBookings"
}
export declare enum ActionButton {
    SignIn = "ActionButton.SignIn",
    TroubleSigningIn = "ActionButton.TroubleSigningIn",
    CreateSlot = "ActionButton.CreateSlot",
    EditSlot = "ActionButton.EditSlot",
    AddAthlete = "ActionButton.AddAthlete",
    AddCustomers = "ActionButton.AddCustomers",
    BookInterval = "ActionButton.BookInterval",
    FinalizeBookings = "ActionButton.FinalizeBookings",
    CustomerBookings = "ActionButton.CustomerBookings",
    SendBookingsEmail = "ActionButton.SendBookingsEmail",
    SendBookingsSMS = "ActionButton.SendBookingsSMS",
    ExtendBookingDate = "ActionButton.ExtendBookingDate",
    Save = "ActionButton.Save",
    Next = "ActionButton.Next",
    Cancel = "ActionButton.Cancel",
    ShowAll = "ActionButton.ShowAll",
    Done = "ActionButton.Done",
    Send = "ActionButton.Send",
    Dismiss = "ActionButton.Dismiss",
    Submit = "ActionButton.Submit",
    Verify = "ActionButton.Verify",
    Add = "ActionButton.Add"
}
export declare enum BirthdayMenu {
    ShowAll = "BirthdayMenu.ShowAll",
    UpcomingBirthdays = "BirthdayMenu.UpcomingBirthdays"
}
export declare enum NotificationMessage {
    BookingSuccess = "Notification.BookingSuccess",
    BookingCanceled = "Notification.BookingCanceled",
    BookingCanceledError = "Notification.BookingCanceledError",
    SlotAdded = "Notification.SlotAdded",
    SlotUpdated = "Notification.SlotUpdated",
    SlotDeleted = "Notification.SlotRemoved",
    LogoutSuccess = "Notification.LogoutSuccess",
    LogoutError = "Notification.LogoutError",
    Updated = "Notification.Updated",
    Removed = "Notification.Removed",
    EmailSent = "Notification.EmailSent",
    SMSSent = "Notification.SMSSent",
    BookingDateExtended = "Notification.BookingdateExtended",
    Error = "Notification.Error"
}
export declare enum BookingCountdownMessage {
    FirstDeadline = "BookingCountdownMessage.FirstDeadline",
    SecondDeadline = "BookingCountdownMessage.SecondDeadline",
    BookingsLocked = "BookingCountdownMessage.BookingsLocked"
}
export declare enum Flags {
    Deleted = "Flags.Deleted"
}
export declare enum DateFormat {
    Weekday = "Date.Weekday",
    Day = "Date.Day",
    Month = "Date.Month",
    Full = "Date.Full",
    DayMonth = "Date.DayMonth",
    MonthYear = "Date.MonthYear",
    Time = "Date.Time",
    Placeholder = "Date.Placeholder",
    Today = "Date.Today"
}
export declare enum AdminAria {
    PageNav = "AdminAria.PageNav",
    SeePastDates = "AdminAria.SeePastDates",
    SeeFutureDates = "AdminAria.SeeFutureDates",
    ToggleSlotOperations = "AdminAria.ToggleSlotOperations",
    CopySlots = "AdminAria.CopySlots",
    PasteSlots = "AdminAria.PasteSlots",
    CreateSlots = "AdminAria.CreateSlots"
}
export declare enum SlotFormAria {
    SlotCategory = "SlotFormAria.SlotCategory",
    SlotType = "SlotFormAria.SlotType",
    AddInterval = "SlotFormAria.AddInterval",
    IntervalStart = "SlotFormAria.IntervalStart",
    IntervalEnd = "SlotFormAria.IntervalEnd",
    DeleteInterval = "SlotFormAria.DeleteInterval",
    SlotNotes = "SlotFormAria.SlotNotes",
    CancelSlot = "SlotFormAria.CancelSlot",
    ConfirmCreateSlot = "SlotFormAria.ConfirmCreateSlot",
    ConfirmEditSlot = "SlotFormAria.ConfirmEditSlot"
}
export declare enum Alerts {
    NoSlots = "Alerts.NoSlots"
}
