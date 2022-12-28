import { Category, SlotType, DeprecatedCategory } from "@eisbuk/shared";

// #region navigation
export enum NavigationLabel {
  Attendance = "NavigationLabel.Attendance",
  Athletes = "NavigationLabel.Athletes",
  Bookings = "NavigationLabel.Bookings",
  OrganizationSettings = "NavigationLabel.OrganizationSettings",
  Slots = "NavigationLabel.Slots",
}
export enum CustomerNavigationLabel {
  Book = "CustomerNavigation.Book",
  Calendar = "CustomerNavigation.Calendar",
  Profile = "CustomerNavigation.Profile",
}

export enum AttendanceNavigationLabel {
  Day = "AttendanceNavigation.Day",
  Month = "AttendanceNavigation.Month",
}
// #endregion navigation

// #region auth
export enum AuthMessage {
  NotAuthorized = "Authorization.NotAuthorized",
  AdminsOnly = "Authorization.AdminsOnly",
  ContactAdminsForRegistration = "Authorization.ContactAdminsForRegistration",
  LoggedInWith = "Authorization.LoggedInWith",
  TryAgain = "Authorization.TryAgain",

  RecoverEmailPassword = "Authorization.RecoverEmailPassword",
  CheckPasswordRecoverEmail = "Authorization.CheckPasswordRecoverEmail",

  CheckSignInEmail = "Authorization.CheckSignInEmail",
  ConfirmSignInEmail = "Authorization.ConfirmSignInEmail",
  DifferentSignInEmail = "Authorization.DifferentSignInEmail",
  ResendEmailLink = "Authorization.ResendEmailLink",

  EnterSMSCode = "Authorization.EnterSMSCode",
  ResendSMS = "Authorization.ResendSMS",
  SMSDataRatesMayApply = "Authorization.SMSDataRatesMayApply",
}
export enum AuthErrorMessage {
  NETWORK_ERROR = "AuthError.NetworkError",
  "auth/user-not-found" = "AuthError.EmailNotFound",
  "auth/wrong-password" = "AuthError.InvalidPassword",
  "auth/invalid-verification-code" = "AuthError.InvalidVerificationCode",
  "auth/invalid-email" = "AuthError.InvalidEmail",
  UNKNOWN = "AuthError.Unknown",
}
export enum AuthTitle {
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
  ResendEmail = "AuthTitle.ResendEmail",
  ResendSMS = "AuthTitle.ResendSMS",
  EnterCode = "AuthTitle.EnterCode",
}
// #endregion auth

// #region dataEntries
export const SlotTypeLabel = {
  [SlotType.Ice]: "SlotType.Ice",
  [SlotType.OffIce]: "SlotType.OffIce",
};
export const CategoryLabel = {
  [Category.PreCompetitiveAdults]: "Category.PreCompetitiveAdults",
  [Category.PreCompetitiveMinors]: "Category.PreCompetitiveMinors",
  [Category.CourseAdults]: "Category.CourseAdults",
  [Category.CourseMinors]: "Category.CourseMinors",
  [Category.Competitive]: "Category.Competitive",
  /** @TODO This should be removed in the future and is here for temporary backwards compatibility */
  [DeprecatedCategory.Adults]: "DeprecatedCategory.Adults",
  [DeprecatedCategory.PreCompetitive]: "DeprecatedCategory.PreCompetitive",
  [DeprecatedCategory.Course]: "DeprecatedCategory.Course",
};
// #endregion dataEntries

// #region forms
export enum CustomerFormTitle {
  NewCustomer = "FormTitle.NewCustomer",
  EditCustomer = "FormTitle.EditCustomer",
}
export enum SlotFormTitle {
  NewSlot = "FormTitle.NewSlot",
  EditSlot = "FormTitle.EditSlot",
}
export enum SlotFormLabel {
  Type = "SlotForm.Type",
  Categories = "SlotForm.Categories",
  Intervals = "SlotForm.Intervals",
  AddInterval = "SlotForm.AddInterval",
  StartTime = "SlotForm.StartTime",
  EndTime = "SlotForm.EndTime",
}
export enum CustomerLabel {
  Welcome = "CustomerLabel.Welcome",
  FillTheForm = "CustomerLabel.FillTheForm",

  Name = "CustomerLabel.Name",
  Surname = "CustomerLabel.Surname",
  Categories = "CustomerLabel.Categories",
  Email = "CustomerLabel.Email",
  Phone = "CustomerLabel.Phone",
  Birthday = "CustomerLabel.DateOfBirth",
  CertificateExpiration = "CustomerLabel.MedicalCertificate",
  CardNumber = "CustomerLabel.CardNumber",
  CovidCertificateReleaseDate = "CustomerLabel.CovidCertificateReleaseDate",
  CovidCertificateSuspended = "CustomerLabel.CovidCertificateSuspended",
  ExtendedBookingDate = "CustomerLabel.ExtendedBookingDate",
  MedicalDetails = "CustomerLabel.MedicalDetails",
  ManageMedicalDetails = "CustomerLabel.ManageMedicalDetails",
  PersonalDetails = "CustomerLabel.PersonalDetails",
  ManagePersonalDetails = "CustomerLabel.ManagePersonalDetails",
  RegistrationCode = "CustomerLabel.RegistrationCode",
  InputRegistrationCode = "CustomerLabel.InputRegistrationCode",
}
export enum ValidationMessage {
  Email = "Validations.Email",
  RequiredEntry = "Validations.RequiredEntry",
  RequiredField = "Validations.RequiredField",
  InvalidTime = "Validations.InvalidTime",
  InvalidDate = "Validations.InvalidDate",
  InvalidPhone = "Validations.InvalidPhone",
  TimeMismatch = "Validations.TimeMismatch",
  WeakPassword = "Validations.WeakPassword",
  InvalidSmsFrom = "Validations.InvalidSmsFrom",
  InvalidSmsFromLength = "Validations.InvalidSmsFromLength",
}
export enum OrganizationLabel {
  EmailNameFrom = "OrganizationLabel.EmailNameFrom",
  EmailFrom = "OrganizationLabel.EmailFrom",
  EmailTemplate = "OrganizationLabel.EmailTemplate",
  SmsFrom = "OrganizationLabel.SmsFrom",
  SmsTemplate = "OrganizationLabel.SmsTemplate",
  DisplayName = "OrganizationLabel.DisplayName",
  Location = "OrganizationLabel.Location",
  CountryCode = "OrganizationLabel.CountryCode",
  Admins = "OrganizationLabel.Admins",
  AddNewAdmin = "OrganizationLabel.AddNewAdmin",
  Email = "OrganizationLabel.Email",
  SMS = "OrganizationLabel.SMS",
  General = "OrganizationLabel.General",
  RegistrationCode = "OrganizationLabel.RegistrationCode",
}
export enum BookingNotesForm {
  Placeholder = "BookingNotesForm.Placeholder",
  HelpText = "BookingNotesForm.HelpText",
}
// #endregion forms

// #region dialog
export enum Prompt {
  DeleteCustomer = "Prompt.DeleteCustomer",
  DeleteSlot = "Prompt.DeleteSlot",
  DeleteSlotDisabledTitle = "Prompt.DeleteSlotDisabledTitle",
  DeleteSlotDisabled = "Prompt.DeleteSlotDisabled",

  NonReversible = "Prompt.NonReversible",

  SendEmailTitle = "Prompt.SendEmailTitle",
  ConfirmEmail = "Prompt.ConfirmEmail",
  NoEmailTitle = "Prompt.NoEmailTitle",
  NoEmailMessage = "Prompt.NoEmailMessage",
  SendSMSTitle = "Prompt.SendSMSTitle",
  ConfirmSMS = "Prompt.ConfirmSMS",
  NoPhoneTitle = "Prompt.NoPhoneTitle",
  NoPhoneMessage = "Prompt.NoPhoneMessage",

  ExtendBookingDateTitle = "Prompt.ExtendBookingDateTitle",
  ExtendBookingDateBody = "Prompt.ExtendBookingDateBody",

  CancelBookingTitle = "Prompt.CancelBookingTitle",
  FinalizeBookingsTitle = "Prompt.FinalizeBookingsTitle",
  ConfirmFinalizeBookings = "Prompt.ConfirmFinalizeBookings",
  EnterEmailTitle = "Prompt.EnterEmailTitle",
  EnterEmailMessage = "Prompt.EnterEmailMessage",
}

export enum ActionButton {
  SignIn = "ActionButton.SignIn",
  TroubleSigningIn = "ActionButton.TroubleSigningIn",
  CodeNotReceived = "ActionButton.CodeNotReceived",

  CreateSlot = "ActionButton.CreateSlot",
  EditSlot = "ActionButton.EditSlot",

  AddAthlete = "ActionButton.AddAthlete",
  AddCustomers = "ActionButton.AddCustomers",

  BookInterval = "ActionButton.BookInterval",
  FinalizeBookings = "ActionButton.FinalizeBookings",
  AddToCalendar = "ActionButton.AddToCalendar",

  CustomerBookings = "ActionButton.CustomerBookings",
  SendBookingsEmail = "ActionButton.SendBookingsEmail",
  SendBookingsSMS = "ActionButton.SendBookingsSMS",
  ExtendBookingDate = "ActionButton.ExtendBookingDate",

  Save = "ActionButton.Save",
  Next = "ActionButton.Next",
  Cancel = "ActionButton.Cancel",
  Confirm = "ActionButton.Confirm",
  ShowAll = "ActionButton.ShowAll",
  Done = "ActionButton.Done",
  Send = "ActionButton.Send",
  Resend = "ActionButton.Resend",
  Dismiss = "ActionButton.Dismiss",
  Submit = "ActionButton.Submit",
  Verify = "ActionButton.Verify",
  Add = "ActionButton.Add",
  Edit = "ActionButton.Edit",
  Delete = "ActionButton.Delete",
}
// #endregion dialog

// #region birthdayMenu
export enum BirthdayMenu {
  ShowAll = "BirthdayMenu.ShowAll",
  UpcomingBirthdays = "BirthdayMenu.UpcomingBirthdays",
}
// #endregion birthdayMenu

// #region notifications
export enum NotificationMessage {
  BookingSuccess = "Notification.BookingSuccess",
  BookingCanceled = "Notification.BookingCanceled",
  BookingCanceledError = "Notification.BookingCanceledError",
  BookingNotesUpdated = "Notification.BookingNotesUpdated",
  BookingNotesError = "Notification.BookingNotesError",

  SlotAdded = "Notification.SlotAdded",
  SlotUpdated = "Notification.SlotUpdated",
  SlotDeleted = "Notification.SlotRemoved",

  LogoutSuccess = "Notification.LogoutSuccess",
  LogoutError = "Notification.LogoutError",

  Updated = "Notification.Updated",
  Removed = "Notification.Removed",

  EmailSent = "Notification.EmailSent",
  SMSSent = "Notification.SMSSent",
  BookingDateExtended = "Notification.BookingDateExtended",

  Error = "Notification.Error",
  SlotsAddedToCalendar = "Notification.SlotsAddedToCalendar",

  CustomerProfileRegistered = "Notification.CustomerProfileRegistered",
  CustomerProfileUpdated = "Notification.CustomerProfileUpdated",
  CustomerProfileError = "Notification.CustomerProfileError",
}

export enum BookingCountdownMessage {
  FirstDeadline = "BookingCountdownMessage.FirstDeadline",
  SecondDeadline = "BookingCountdownMessage.SecondDeadline",
  BookingsLocked = "BookingCountdownMessage.BookingsLocked",
}
// #endregion notifications

// #region flags
export enum Flags {
  Deleted = "Flags.Deleted",
}
// #endregion flags

// #region date
export enum DateFormat {
  Weekday = "Date.Weekday",
  Day = "Date.Day",
  Month = "Date.Month",
  Full = "Date.Full",
  DayMonth = "Date.DayMonth",
  MonthYear = "Date.MonthYear",
  Time = "Date.Time",
  Placeholder = "Date.Placeholder",
  Today = "Date.Today",
  FullWithWeekday = "Date.FullWithWeekday",
  Date = "Date.Date",
}
// #endregion date

// #region aria-labels
export enum AdminAria {
  PageNav = "AdminAria.PageNav",
  SeePastDates = "AdminAria.SeePastDates",
  SeeFutureDates = "AdminAria.SeeFutureDates",
  ToggleSlotOperations = "AdminAria.ToggleSlotOperations",
  CopySlotsWeek = "AdminAria.CopySlotsWeek",
  CopySlotsDay = "AdminAria.CopySlotsDay",
  CopiedSlotsWeekBadge = "AdminAria.CopiedSlotsWeekBadge",
  CopiedSlotsDayBadge = "AdminAria.CopiedSlotsDayBadge",
  PasteSlots = "AdminAria.PasteSlots",
  CreateSlots = "AdminAria.CreateSlots",
  EnableEdit = "AdminAria.EnableEdit",
}

export enum SlotFormAria {
  SlotCategory = "SlotFormAria.SlotCategory",
  SlotType = "SlotFormAria.SlotType",
  AddInterval = "SlotFormAria.AddInterval",
  IntervalStart = "SlotFormAria.IntervalStart",
  IntervalEnd = "SlotFormAria.IntervalEnd",
  DeleteInterval = "SlotFormAria.DeleteInterval",
  SlotNotes = "SlotFormAria.SlotNotes",
  CancelSlot = "SlotFormAria.CancelSlot",
  ConfirmCreateSlot = "SlotFormAria.ConfirmCreateSlot",
  ConfirmEditSlot = "SlotFormAria.ConfirmEditSlot",
}
export enum BookingAria {
  BookButton = "BookingAria.BookButton",
}
// #endregion aria-labels

// #region alerts
export enum Alerts {
  NoSlots = "Alerts.NoSlots",
  NoBookings = "Alerts.NoBookings",
  NoAttendance = "Alerts.NoAttendance",
  NoCategories = "Alerts.NoCategories",
  ContactEmail = "Alerts.ContactEmail",
}
// #endregion alerts

// #region printable_attendance
export enum PrintableAttendance {
  Start = "PrintableAttendance.Start",
  End = "PrintableAttendance.End",
  TotalHours = "PrintableAttendance.TotalHours",
  Trainer = "PrintableAttendance.Trainer",
  Athlete = "PrintableAttendance.Athlete",
  Signature = "PrintableAttendance.Signature",
  Note = "PrintableAttendance.Note",
}
// #endregion printable_attendance

// #region tables
export enum AttendanceVarianceHeaders {
  Athlete = "AttendanceVarianceHeaders.Athlete",
  Total = "AttendanceVarianceHeaders.Total",
}
// #endregion tables

// #region forms
export enum Forms {
  ShowPassword = "Forms.ShowPassword",
  HidePassword = "Forms.HidePassword",
}
// #endregion forms
