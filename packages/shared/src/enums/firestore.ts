// region collections names
export enum Collection {
  Organizations = "organizations",
  /**
   * Queue for emails waiting to be sent using `firestore-send-email`
   * extension. The value is "mail" as it's the default for an extension.
   *
   * This can be changed, but the change should be reflected in firestore extension setup as well.
   */
  Secrets = "secrets",
  /**
   * A collection for each organization for fields in
   * an organization we want made public and accessible for customers
   */
  PublicOrgInfo = "publicOrgInfo",
  /**
   * All process delivery queues (such as email, SMS) are stored here, on per-organization basis
   */
  DeliveryQueues = "deliveryQueues",
  /**
   * Reports of sanity db sanity check runs.
   */
  SanityChecks = "sanityChecks",
}

export enum OrgSubCollection {
  Slots = "slots",
  SlotsByDay = "slotsByDay",
  SlotBookingsCounts = "slotBookingsCounts",

  Customers = "customers",
  Bookings = "bookings",
  Attendance = "attendance",
}

export enum BookingSubCollection {
  BookedSlots = "bookedSlots",
  AttendedSlots = "attendedSlots",
  Calendar = "calendar",
}

export enum DeliveryQueue {
  EmailQueue = "emailQueue",
  SMSQueue = "SMSQueue",
}

export enum SanityCheckKind {
  SlotAttendance = "slotAttendance",
  SlotBookings = "slotBookings",
  SlotSlotsByDay = "slotSlotsByDay",
}

// endregion

// region slots
export enum SlotType {
  Ice = "ice",
  OffIce = "off-ice",
}

export enum Category {
  PreCompetitiveAdults = "pre-competitive-adults",
  PreCompetitiveMinors = "pre-competitive-minors",
  CourseAdults = "course-adults",
  CourseMinors = "course-minors",
  Competitive = "competitive",
  PrivateLessons = "private-lessons",
}
// endregion
