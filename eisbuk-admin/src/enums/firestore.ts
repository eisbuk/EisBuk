// region collections names
export enum Collection {
  Organizations = "organizations",
}

export enum OrgSubCollection {
  Slots = "slots",
  SlotsByDay = "slotsByDay",
  Customers = "customers",
  Bookings = "bookings",
  BookingsByDay = "bookingsByDay",
}

export enum BookingSubCollection {
  SubscribedSlots = "subscribedSlots",
}
// endregion

// region slots
export enum Notes {
  Null = "",
  Pista1 = "pista1",
  Pista2 = "pista2",
  PrimaSeconda = "Prima riga\nSeconda riga",
}

export enum SlotType {
  OffIceDanza = "off-ice-danza",
  Ice = "ice",
  OffIceGym = "off-ice-gym",
}

export enum Category {
  Corso = "corso",
  Agonismo = "agonismo",
  Preagonismo = "preagonismo",
  Adulti = "adulti",
}

export enum Duration {
  "1h" = "60",
  "1.5h" = "90",
  "2h" = "120",
}
// endregion
