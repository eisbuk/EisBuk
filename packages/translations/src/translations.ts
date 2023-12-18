import { Category, SlotType } from "@eisbuk/shared";

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

export enum SettingsNavigationLabel {
  GeneralSettings = "SettingsNavigationLabel.GeneralSettings",
  EmailTemplates = "SettingsNavigationLabel.EmailTemplates",
  SMSTemplates = "SettingsNavigationLabel.SMSTemplates",
}
// #endregion navigation

// #region auth
export enum AuthMessage {
  NotAuthorized = "Authorization.NotAuthorized",
  AdminsOnly = "Authorization.AdminsOnly",
  ContactAdminsForRegistration = "Authorization.ContactAdminsForRegistration",
  LoggedInWith = "Authorization.LoggedInWith",
  TryAgain = "Authorization.TryAgain",

  DeletedTitle = "Authorization.DeletedTitle",
  DeletedSubtitle = "Authorization.DeletedSubtitle",

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
  [Category.PrivateLessons]: "Category.PrivateLessons",
};
// #endregion dataEntries

// #region forms
export enum CustomerFormTitle {
  NewCustomer = "FormTitle.NewCustomer",
  AthleteProfile = "FormTitle.AthleteProfile",
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
  DeleteIntervalDisabled = "SlotForm.DeleteIntervalDisabled",
  Capacity = "SlotForm.Capacity",
  CapacityDescription = "SlotForm.CapacityDescription",
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
  ExtendedBookingDate = "CustomerLabel.ExtendedBookingDate",
  MedicalDetails = "CustomerLabel.MedicalDetails",
  ManageMedicalDetails = "CustomerLabel.ManageMedicalDetails",
  PersonalDetails = "CustomerLabel.PersonalDetails",
  ManagePersonalDetails = "CustomerLabel.ManagePersonalDetails",

  RegistrationCode = "CustomerLabel.RegistrationCode",
  InputRegistrationCode = "CustomerLabel.InputRegistrationCode",

  AdminValues = "CustomerLabel.AdminValues",
  AdminValuesDescription = "CustomerLabel.AdminValuesDescription",
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
  InvalidInterval = "Validations.InvalidInterval",
  InvalidSmsFrom = "Validations.InvalidSmsFrom",
  InvalidSmsFromLength = "Validations.InvalidSmsFromLength",
  InvalidRegistrationCode = "Validations.InvalidRegistrationCode",
}
export enum OrganizationLabel {
  SettingsTitle = "OrganizationLabel.SettingsTitle",

  General = "OrganizationLabel.General",

  Admins = "OrganizationLabel.Admins",
  AddNewAdmin = "OrganizationLabel.AddNewAdmin",

  DisplayName = "OrganizationLabel.DisplayName",
  DisplayNameHelpText = "OrganizationLabel.DisplayNameHelpText",

  Location = "OrganizationLabel.Location",
  LocationHelpText = "OrganizationLabel.LocationHelpText",

  RegistrationCode = "OrganizationLabel.RegistrationCode",
  RegistrationCodeHelpText = "OrganizationLabel.RegistrationCodeHelpText",

  CountryCode = "OrganizationLabel.CountryCode",
  CountryCodeHelpText = "OrganizationLabel.CountryCodeHelpText",

  Email = "OrganizationLabel.Email",

  EmailNameFrom = "OrganizationLabel.EmailNameFrom",
  EmailNameFromHelpText = "OrganizationLabel.EmailNameFromHelpText",

  EmailFrom = "OrganizationLabel.EmailFrom",
  EmailFromHelpText = "OrganizationLabel.EmailFromHelpText",

  BCC = "OrganizationLabel.BCC",
  BCCHelpText = "OrganizationLabel.BCCHelpText",

  SMS = "OrganizationLabel.SMS",

  SmsFrom = "OrganizationLabel.SmsFrom",
  SmsFromHelpText = "OrganizationLabel.SmsFromHelpText",

  SmsTemplate = "OrganizationLabel.SmsTemplate",
  SmsTemplateHelpText = "OrganizationLabel.SmsTemplateHelpText",
}

export enum MessageTemplateLabel {
  Preview = "MessageTemplateLabel.Preview",

  Subject = "MessageTemplateLabel.Subject",
  Body = "MessageTemplateLabel.Body",

  "send-bookings-link" = "MessageTemplateLabel.SendBookingsLink",
  "send-calendar-file" = "MessageTemplateLabel.SendCalendarFile",
  "send-extended-bookings-date" = "MessageTemplateLabel.SendExtendedBookingsDate",

  BookingsLink = "MessageTemplateLabel.BookingsLink",
  Name = "MessageTemplateLabel.Name",
  Surname = "MessageTemplateLabel.Surname",
  CalendarFile = "MessageTemplateLabel.IcsFile",
  BookingsMonth = "MessageTemplateLabel.BookingsMonth",
  ExtendedBookingsDate = "MessageTemplateLabel.ExtendedBookingsDate",
  OrganizationName = "MessageTemplateLabel.OrganizationName",
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
  LogOut = "ActionButton.LogOut",
  TroubleSigningIn = "ActionButton.TroubleSigningIn",
  CodeNotReceived = "ActionButton.CodeNotReceived",

  AddAthlete = "ActionButton.AddAthlete",
  AddCustomers = "ActionButton.AddCustomers",
  DeleteCustomer = "ActionButton.DeleteCustomer",

  BookInterval = "ActionButton.BookInterval",
  FinalizeBookings = "ActionButton.FinalizeBookings",
  AddToCalendar = "ActionButton.AddToCalendar",

  CustomerBookings = "ActionButton.CustomerBookings",
  SendBookingsEmail = "ActionButton.SendBookingsEmail",
  SendBookingsSMS = "ActionButton.SendBookingsSMS",
  ExtendBookingDate = "ActionButton.ExtendBookingDate",

  CustomInterval = "ActionButton.CustomInterval",

  LearnMore = "ActionButton.LearnMore",

  Save = "ActionButton.Save",
  Back = "ActionButton.Back",
  Next = "ActionButton.Next",
  Cancel = "ActionButton.Cancel",
  Reset = "ActionButton.Reset",
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
  Saving = "ActionButton.Saving",
  Accept = "ActionButton.Accept",
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
  BookingError = "Notification.BookingError",
  BookingCanceled = "Notification.BookingCanceled",
  BookingCanceledError = "Notification.BookingCanceledError",
  BookingNotesUpdated = "Notification.BookingNotesUpdated",
  BookingNotesError = "Notification.BookingNotesError",

  SlotAdded = "Notification.SlotAdded",
  SlotAddError = "Notification.SlotAddError",
  SlotUpdated = "Notification.SlotUpdated",
  SlotUpdateError = "Notification.SlotUpdateError",
  SlotDeleted = "Notification.SlotRemoved",
  SlotDeleteError = "Notification.SlotRemoveError",

  CopyPasteErrorDay = "Notification.CopyPasteErrorDay",
  CopyPasteErrorWeek = "Notification.CopyPasteErrorWeek",

  LogoutSuccess = "Notification.LogoutSuccess",
  LogoutError = "Notification.LogoutError",

  Updated = "Notification.Updated",
  Removed = "Notification.Removed",

  EmailSent = "Notification.EmailSent",
  SMSSent = "Notification.SMSSent",

  BookingDateExtended = "Notification.BookingDateExtended",
  BookingDateExtendedError = "Notification.BookingDateExtendedError",

  Error = "Notification.Error",
  SlotsAddedToCalendar = "Notification.SlotsAddedToCalendar",

  MarkAbsenceError = "Notification.MarkAbsenceError",
  MarkAttendanceError = "Notification.MarkAttendanceError",

  SelfRegSuccess = "Notification.SelfRegSuccess",
  SelfRegError = "Notification.SelfRegError",

  SelectionSaved = "Notification.SelectionSaved",

  CustomerProfileUpdated = "Notification.CustomerProfileUpdated",
  CustomerProfileError = "Notification.CustomerProfileUpdated",
  CustomerUpdated = "Notification.CustomerUpdated",
  CustomerUpdateError = "Notification.CustomerUpdateError",
  CustomerDeleted = "Notification.CustomerDeleted",
  CustomerDeleteError = "Notification.CustomerDeleteError",
  CustomerDeleteErrorFutureBookings = "Notification.CustomerDeleteErrorFutureBookings",
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

  CloseModal = "AdminAria.CloseModal",
  BirthdayMenu = "AdminAria.BirthdayMenu",
  AthletesApprovalIcon = "AdminAria.AthletesApprovalIcon",
  AthletesApprovalButton = "AdminAria.AthletesApprovalButton",
}

export enum SlotsAria {
  ToggleSlotOperations = "SlotsAria.ToggleSlotOperations",
  CopySlotsWeek = "SlotsAria.CopySlotsWeek",
  CopySlotsDay = "SlotsAria.CopySlotsDay",
  CopiedSlotsWeekBadge = "SlotsAria.CopiedSlotsWeekBadge",
  CopiedSlotsDayBadge = "SlotsAria.CopiedSlotsDayBadge",
  PasteSlotsDay = "SlotsAria.PasteSlotsDay",
  PasteSlotsWeek = "SlotsAria.PasteSlotsWeek",
  CreateSlot = "SlotsAria.CreateSlot",
  EnableEdit = "SlotsAria.EnableEdit",
}

export enum AttendanceAria {
  AddAttendedCustomers = "AttendanceAria.AddAttendedCustomers",
  PreviousInterval = "AttendanceAria.PreviousInterval",
  NextInterval = "AttendanceAria.NextInterval",
  MarkPresent = "AttendanceAria.MarkPresent",
  MarkAbsent = "AttendanceAria.MarkAbsent",
  AddCustomInterval = "AttendanceAria.AddCustomInterval",
  CancelCustomInterval = "AttendanceAria.CancelCustomInterval",
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
  ErrorBoundary = "Alerts.ErrorBoundary",
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
