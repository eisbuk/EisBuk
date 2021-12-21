export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateTestSlots = "createTestSlots",
  CreateStaleTestData = "createStaleTestData",

  MigrateSlotsToPluralCategories = "migrateSlotsToPluralCategories",
  MigrateToNewDataModel = "migrateToNewDataModel",
  PruneSlotsByDay = "pruneSlotsByDay",
  AddIdsToCustomers = "addIdsToCustomers",
}
