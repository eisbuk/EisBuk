// #region projectIcons
export enum ProjectIcons {
  AcUnit = "AcUnit",
  AccessibilityNew = "AccessibilityNew",
  FitnessCenter = "FitnessCenter",
}
// #endregion projectIcons

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

// #region BookingCard
/**
 * Controlls different rendering options of `BookingCard` for `book_ice/book_off_ice` or `calendar` views.
 */
export enum BookingCardVariant {
  Booking = "booking",
  Calendar = "calendar",
}

export enum BookingDuration {
  "0.5h" = "½h",
  "1h" = "1h",
  "1.5h" = "1½h",
  "2h" = "2h",
  "2+h" = "2H+",
}
// #endregion BookingCard
