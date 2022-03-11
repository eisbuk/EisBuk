export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  FinalizeBookings = "finalizeBookings",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateDefaultUser = "createDefaultUser",
  CreateTestSlots = "createTestSlots",
  CreateStaleTestData = "createStaleTestData",

  MigrateSlotsToPluralCategories = "migrateSlotsToPluralCategories",
  MigrateToNewDataModel = "migrateToNewDataModel",
  PruneSlotsByDay = "pruneSlotsByDay",
  AddIdsToCustomers = "addIdsToCustomers",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
  UnifyOffIceLabels = "unifyOffIceLabels",
}
