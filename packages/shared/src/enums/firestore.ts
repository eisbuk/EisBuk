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
  Calendar = "calendar",
}

export enum DeliveryQueue {
  EmailQueue = "emailQueue",
  SMSQueue = "SMSQueue",
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
  /** @TODO Soon to be deprecated */
  // Adults = "adults",
}

// endregion
