/**
 * This is a file with temporary values copy/pasted from client app.
 * This should be replaced with single-source-of-truth
 */

/** */
export enum Routes {
  Login = "/login",
  Unauthorized = "/unautorized",
  CustomerArea = "/customer_area",
  AttendancePrintable = "/attendance_printable",
  Debug = "/debug",
}

/** */
export enum CustomerRoute {
  Calendar = "calendar",
  BookIce = "book_ice",
  BookOffIce = "book_off_ice",
}

/** */
export enum PrivateRoutes {
  Root = "/",
  Athletes = "/athletes",
  Slots = "/slots",
  AdminPreferences = "/admin_preferences",
}

/** */
export enum CloudFunction {
  Ping = "ping",
  SendEmail = "sendEmail",
  SendSMS = "sendSMS",

  FinalizeBookings = "finalizeBookings",

  CreateTestData = "createTestData",
  CreateOrganization = "createOrganization",
  CreateDefaultUser = "createDefaultUser",
  CreateTestSlots = "createTestSlots",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
}

/** */
export const defaultUser = {
  email: "test@eisbuk.it",
  password: "test00",
  phone: "+3912345678",
};
