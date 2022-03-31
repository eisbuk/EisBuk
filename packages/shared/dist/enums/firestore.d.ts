export declare enum Collection {
    Organizations = "organizations",
    /**
     * Queue for emails waiting to be sent using `firestore-send-email`
     * extension. The value is "mail" as it's the default for an extension.
     *
     * This can be changed, but the change should be reflected in firestore extension setup as well.
     */
    EmailQueue = "mail",
    /**
     * A separate "secrets" collection for each organization.
     * "Hidden away" from client by firestore.rules, can only be
     * accessed from cloud function environment and written to from the client.
     */
    Secrets = "secrets"
}
export declare enum OrgSubCollection {
    Slots = "slots",
    SlotsByDay = "slotsByDay",
    Customers = "customers",
    Bookings = "bookings",
    Attendance = "attendance"
}
export declare enum BookingSubCollection {
    BookedSlots = "bookedSlots"
}
export declare enum SlotType {
    Ice = "ice",
    OffIce = "off-ice"
}
export declare enum Category {
    Course = "course",
    PreCompetitive = "pre-competitive",
    Competitive = "competitive",
    Adults = "adults"
}
