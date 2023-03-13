export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  QueryAuthStatus = "queryAuthStatus",

  FinalizeBookings = "finalizeBookings",
  CustomerSelfRegister = "customerSelfRegister",
  CustomerSelfUpdate = "customerSelfUpdate",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateDefaultUser = "createDefaultUser",
  CreateUser = "createUser",
  CreateTestSlots = "createTestSlots",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
  MigrateCategoriesToExplicitMinors = "migrateCategoriesToExplicitMinors",
  CustomersToPluralCategories = "customersToPluralCategories",
  PopulateDefaultEmailTemplates = "populateDefaultEmailTemplates",
  RemoveInvalidCustomerPhones = "removeInvalidCustomerPhones",
}
