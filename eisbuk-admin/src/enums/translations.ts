import { Category, SlotType } from "eisbuk-shared";

// #region navigation
export enum NavigationLabel {
  Attendance = "NavigationLabel.Attendance",
  Athletes = "NavigationLabel.Athletes",
  Bookings = "NavigationLabel.Bookings",
}
export enum CustomerNavigationLabel {
  "book_ice" = "CustomerNavigation.BookIce",
  "book_off_ice" = "CustomerNavigation.BookOffIce",
  "calendar" = "CustomerNavigation.Calendar",
}
// #endregion navigation

// #region authorization
export enum AuthMessage {
  NotAuthorized = "Authorization.NotAuthorized",
  AdminsOnly = "Authorization.AdminsOnly",
  LoggedInWith = "Authorization.LoggedInWith",
  TryAgain = "Authorization.TryAgain",
}
// #endregion authorization

// #region dataEntries
export const SlotTypeLabel = {
  [SlotType.Ice]: "SlotType.Ice",
  [SlotType.OffIceDancing]: "SlotType.OffIceDancing",
  [SlotType.OffIceGym]: "SlotType.OffIceGym",
};
export const CategoryLabel = {
  [Category.Adults]: "Category.Adults",
  [Category.PreCompetitive]: "Category.PreCompetitive",
  [Category.Competitive]: "Category.Competitive",
  [Category.Course]: "Category.Course",
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
  Intervals = "SlotForm.Intervals",
  AddInterval = "SlotForm.AddInterval",
  StartTime = "SlotForm.StartTime",
  EndTime = "SlotForm.EndTime",
}
export enum CustomerLabel {
  Name = "CustomerLabel.Name",
  Surname = "CustomerLabel.Surname",
  Category = "CustomerLabel.Category",
  Email = "CustomerLabel.Email",
  Phone = "CustomerLabel.Phone",
  DateOfBirth = "CustomerLabel.DateOfBirth",
  MedicalCertificate = "CustomerLabel.MedicalCertificate",
  CardNumber = "CustomerLabel.CardNumber",
  CovidCertificateReleaseDate = "CustomerLabel.CovidCertificateReleaseDate",
  CovidCertificateSuspended = "CustomerLabel.CovidCertificateSuspended",
}
export enum ValidationMessage {
  Email = "Validations.Email",
  RequiredEntry = "Validations.RequiredEntry",
  RequiredField = "Validations.RequiredField",
  InvalidTime = "Validations.InvalidTime",
  InvalidDate = "Validations.InvalidDate",
  TimeMismatch = "Validations.TimeMismatch",
}
// #endregion forms

// #region dialog
export enum Prompt {
  DeleteCustomer = "Prompt.DeleteCustomer",
  DeleteSlot = "Prompt.DeleteSlot",
  NonReversible = "Prompt.NonReversible",
}
export enum ActionButton {
  CreateSlot = "ActionButton.CreateSlot",
  EditSlot = "ActionButton.EditSlot",
  AddAthlete = "ActionButton.AddAthlete",
  AddCustomers = "ActionButton.AddCustomers",
  BookInterval = "ActionButton.BookInterval",
  Save = "ActionButton.Save",
  Next = "ActionButton.Next",
  Cancel = "ActionButton.Cancel",
}
// #endregion dialog

// #region notifications
export enum NotificationMessage {
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

  Error = "Notification.Error",
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
}
// #endregion date
