import { Category, SlotType } from "eisbuk-shared";

// #region SlotForm
export const __newSlotTitle__ = "SlotForm.NewSlotTitle";
export const __editSlotTitle__ = "SlotForm.EditSlotTitle";
export const __addNewInterval__ = "SlotForm.AddInterval";
// #endregion SlotForm

// #region SlotType
export const slotTypeLabel = {
  [SlotType.Ice]: "SlotType.Ice",
  [SlotType.OffIceDancing]: "SlotType.OffIceDancing",
  [SlotType.OffIceGym]: "SlotType.OffIceGym",
};
// #endregion SlotType

// #region Category
export const categoryLabel = {
  [Category.Adults]: "Category.Adults",
  [Category.PreCompetitive]: "Category.PreCompetitive",
  [Category.Competitive]: "Category.Competitive",
  [Category.Course]: "Category.Course",
};
// #endregion Category

// #region actionButtons
export const __cancel__ = "Action.Cancel";
export const __createSlot__ = "Action.CreateSlot";
export const __editSlot__ = "Action.EditSlot";
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
}

export enum CustomerFormTitle {
  NewCustomer = "CustomerForm.NewCustomer",
  EditCustomer = "CustomerForm.EditCustomer",
}
// #endregion customer

// #region prompt
export enum Prompt {
  DeleteCustomer = "Prompt.DeleteCustomer",
  DeleteSlot = "Prompt.DeleteSlot",
  NonReversible = "Prompt.NonReversible",
}
// #endregion prompt
