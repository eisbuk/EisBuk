export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  FinalizeBookings = "finalizeBookings",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateTestSlots = "createTestSlots",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
}
