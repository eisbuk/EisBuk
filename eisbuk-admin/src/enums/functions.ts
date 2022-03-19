export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  QueryAuthStatus = "queryAuthStatus",

  FinalizeBookings = "finalizeBookings",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateDefaultUser = "createDefaultUser",
  CreateTestSlots = "createTestSlots",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
}
