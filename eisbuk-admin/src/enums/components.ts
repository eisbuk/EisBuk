// #region projectIcons
export enum ProjectIcons {
  AcUnit = "AcUnit",
  AccessibilityNew = "AccessibilityNew",
  FitnessCenter = "FitnessCenter",
}
// #endregion projectIcons

// #region slot
/**
 * Used to toggle between enabling booking action vs just displaying the interval
 */
export enum SlotView {
  Admin = "admin",
  Customer = "customer",
  Calendar = "calendar",
  Booking = "booking",
}
// #endregion slot

// #region slotOperationButtons
/**
 * Used to provide context (`slot`/`day`/`week`) to the slot buttons under the SlotOpeartionButtons button group.
 */
export enum ButtonContextType {
  Slot = "slot",
  Day = "day",
  Week = "week",
}
// #endregion slotOperationButtons
