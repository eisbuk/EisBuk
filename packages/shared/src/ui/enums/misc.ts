export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  // TODO: Rename this to 'queryAuthStatus' once the deprecated function is removed (and the new one renamed).
  QueryAuthStatus = "queryAuthStatus2",

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
  CalculateBookingStatsThisAndNextMonths = "calculateBookingStatsThisAndNextMonths",
  NormalizeExistingEmails = "normalizeExistingEmails",

  DBSlotAttendanceCheck = "dbSlotAttendanceCheck",
  DBSlotBookingsCheck = "dbSlotBookingsCheck",
  DBSlotAttendanceAutofix = "dbSlotAttendanceAutofix",
  DBSlotSlotsByDayCheck = "dbSlotSlotsByDayCheck",
  DBSlotSlotsByDayAutofix = "dbSlotSlotsByDayAutofix",
}
