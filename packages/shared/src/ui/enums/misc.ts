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
  SetupEmailForTesting = "setupEmailForTesting",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
  PopulateDefaultEmailTemplates = "populateDefaultEmailTemplates",
  RemoveInvalidCustomerPhones = "removeInvalidCustomerPhones",
  ClearDeletedCustomersRegistrationAndCategories = "clearDeletedCustomersRegistrationAndCategories",
}
