/**
 * This is a file with temporary values copy/pasted from client app.
 * This should be replaced with single-source-of-truth
 */

import { SlotInterface, SlotInterval } from "@eisbuk/shared";

/** */
export enum Routes {
  Login = "/login",
  Unauthorized = "/unautorized",
  SelfRegister = "/self_register",
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
  NewAthlete = "/athletes/new",
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
  CreateUser = "createUser",
  CreateTestSlots = "createTestSlots",
  SetupEmailForTesting = "setupEmailForTesting",

  PruneSlotsByDay = "pruneSlotsByDay",
  DeleteOrphanedBookings = "deleteOrphanedBookings",
}

/** */
export const defaultUser = {
  email: "test@eisbuk.it",
  password: "test00",
  phone: "+3912345678",
};

export const __dayWithSlots__ = "day-with-slots";
export const __dayWithBookedSlots__ = "day-with-booked-slots";

/**
 * Calculates the `startTime` of earliset interval and the `endTime` of latest interval,
 * @param intervals a record of all intervals
 * @returns a string representation of slot's timespan: `${startTime} - ${endTime}`
 */
export const getSlotTimespan = (
  intervals: SlotInterface["intervals"]
): string => {
  // calculate single { startTime, endTime } object
  const { startTime, endTime } = Object.values(intervals).reduce(
    (acc, interval) => {
      const startTime =
        !acc.startTime || acc.startTime > interval.startTime
          ? interval.startTime
          : acc.startTime;
      const endTime =
        !acc.endTime || acc.endTime < interval.endTime
          ? interval.endTime
          : acc.endTime;

      return { startTime, endTime };
    },
    {} as SlotInterval
  );
  // return time string
  return `${startTime} - ${endTime}`;
};
