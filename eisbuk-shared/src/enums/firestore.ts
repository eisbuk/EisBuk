// region collections names
export enum Collection {
  Organizations = "organizations",
  /**
   * Queue for emails waiting to be sent using `firestore-send-email`
   * extension. The value is "mail" as it's the default for an extension.
   *
   * This can be changed, but the change should be reflected in firestore extension setup as well.
   */
  EmailQueue = "mail",
}

export enum OrgSubCollection {
  Slots = "slots",
  SlotsByDay = "slotsByDay",
  Customers = "customers",
  Bookings = "bookings",
  Attendance = "attendance",
  Secrets = "secrets",
}

export enum BookingSubCollection {
  BookedSlots = "bookedSlots",
}
// endregion

// region slots
export enum SlotType {
  Ice = "ice",
  OffIceDancing = "off-ice-dancing",
  OffIceGym = "off-ice-gym",
}

export enum Category {
  Course = "course",
  PreCompetitive = "pre-competitive",
  Competitive = "competitive",
  Adults = "adults",
}

// endregion
