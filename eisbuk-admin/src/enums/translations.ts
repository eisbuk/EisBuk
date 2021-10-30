import { Category, SlotType } from "eisbuk-shared";

// #region SlotForm
export enum SlotFormLabel {
  Type = "SlotForm.Type",
  Intervals = "SlotForm.Intervals",
  AddInterval = "SlotForm.AddInterval",
  StartTime = "SlotForm.StartTime",
  EndTime = "SlotForm.EndTime",
}
// #endregion SlotForm

// #region SlotType
export const SlotTypeLabel = {
  [SlotType.Ice]: "SlotType.Ice",
  [SlotType.OffIceDancing]: "SlotType.OffIceDancing",
  [SlotType.OffIceGym]: "SlotType.OffIceGym",
};
// #endregion SlotType

// #region Category
export const CategoryLabel = {
  [Category.Adults]: "Category.Adults",
  [Category.PreCompetitive]: "Category.PreCompetitive",
  [Category.Competitive]: "Category.Competitive",
  [Category.Course]: "Category.Course",
};
// #endregion Category

// #region actionButtons
export enum ActionButton {
  CreateSlot = "ActionButton.CreateSlot",
  EditSlot = "ActionButton.EditSlot",
  Save = "ActionButton.Save",
  Cancel = "ActionButton.Cancel",
}
// #endregion actionButtons

// #region attendanceCard
export const __addCustomersTitle__ = "AttendanceCard.AddCustomersTitle";
// #endregion attendanceCard

// #region intervals
export const __bookInterval__ = "BookingCard.BookInterval";
export const __cancelBooking__ = "BookingCard.CancelBooking";
// #endregion intervals

// #region validationMessages
export enum ValidationMessage {
  Email = "Validations.Email",
  RequiredEntry = "Validations.RequiredEntry",
  RequiredField = "Validations.RequiredField",
  InvalidTime = "Validations.InvalidTime",
  InvalidDate = "Validations.InvalidDate",
  TimeMismatch = "Validations.TimeMismatch",
}
// #endregion validationMessages

// #region date
export enum DateFormat {
  Weekday = "Date.Weekday",
  Day = "Date.Day",
  Month = "Date.Month",
  Full = "Date.Full",
  DayMonth = "Date.DayMonth",
  MonthYear = "Date.MonthYear",
  Time = "Date.Time",
}
// #endregion date

// #region customer
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

// #endregion customer

// #region FormTitle
export enum CustomerFormTitle {
  NewCustomer = "FormTitle.NewCustomer",
  EditCustomer = "FormTitle.EditCustomer",
}

export enum SlotFormTitle {
  NewSlot = "FormTitle.NewSlot",
  EditSlot = "FormTitle.EditSlot",
}
// #endregion FormTitle

// #region prompt
export enum Prompt {
  DeleteCustomer = "Prompt.DeleteCustomer",
  DeleteSlot = "Prompt.DeleteSlot",
  NonReversible = "Prompt.NonReversible",
}
// #endregion prompt
