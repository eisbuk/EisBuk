// #region projectIcons
export enum ProjectIcons {
  AcUnit = "AcUnit",
  AccessibilityNew = "AccessibilityNew",
  FitnessCenter = "FitnessCenter",
}
// #endregion projectIcons

// #region slot
/**
 * Used to toggle between showing subscribe actions or slot operations (create, edit, etc.)
 */
export enum SlotView {
  Admin = "admin",
  Customer = "customer",
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

// #region BookingCard
/**
 * Controlls different rendering options of `BookingCard` for `book_ice/book_off_ice` or `calendar` views.
 */
export enum BookingCardVariant {
  Booking = "booking",
  Calendar = "calendar",
}
// #endregion BookingCard
