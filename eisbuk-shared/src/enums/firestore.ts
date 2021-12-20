// region collections names
export enum Collection {
  Organizations = "organizations",
  EmailQueue = "emailQueue",
}

export enum OrgSubCollection {
  Slots = "slots",
  SlotsByDay = "slotsByDay",
  Customers = "customers",
  Bookings = "bookings",
  Attendance = "attendance",
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
