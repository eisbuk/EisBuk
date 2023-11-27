export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  QueryAuthStatus = "queryAuthStatus",

  FinalizeBookings = "finalizeBookings",
  AcceptPrivacyPolicy = "acceptPrivacyPolicy",
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
  NormalizeExistingEmails = "normalizeExistingEmails",

  DBSlotAttendanceCheck = "dbSlotAttendanceCheck",
  DBSlotBookingsCheck = "dbSlotBookingsCheck",
  DBSlotAttendanceAutofix = "dbSlotAttendanceAutofix",
}
