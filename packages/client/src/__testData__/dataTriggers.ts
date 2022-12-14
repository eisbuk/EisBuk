import {
  CustomerAttendance,
  CustomerBookingEntry,
  EmailType,
  OrganizationData,
  SlotAttendnace,
} from "@eisbuk/shared";

import { testDate } from "@/__testData__/date";
import { saul } from "@/__testData__/customers";
import { intervals as intervalsRecord } from "@/__testData__/slots";

export const intervals = Object.keys(intervalsRecord);

/**
 * Interval we're using to test booking triggering attendance
 */
const bookedInterval = intervals[0];
/**
 * Booking we're marking for our customer in order to test attendance trigger
 */
export const testBooking: CustomerBookingEntry = {
  date: testDate,
  interval: bookedInterval,
};
/**
 * Dummy customer with attendance
 */
export const dummyAttendance: Record<string, CustomerAttendance> = {
  ["dummy-customer"]: {
    bookedInterval: intervals[0],
    attendedInterval: intervals[1],
  },
};
/**
 * Empty attendance entry for slot. Should be created when the slot is created.
 */
export const emptyAttendance: SlotAttendnace = {
  date: testDate,
  attendances: {},
};
/**
 * Base attendance entry for slot without test user's attendance
 */
export const baseAttendance: SlotAttendnace = {
  ...emptyAttendance,
  attendances: {
    ...dummyAttendance,
  },
};
/**
 * Attendance entry with customer attendance for our test customer.
 * We're using this to test adding booked attendance when customer books a slot.
 */
export const attendanceWithTestCustomer: SlotAttendnace = {
  date: testDate,
  attendances: {
    ...dummyAttendance,
    [saul.id]: {
      bookedInterval: bookedInterval,
      attendedInterval: bookedInterval,
    },
  },
};

export const organization: OrganizationData = {
  displayName: "Los Pollos Hermanos",
  location: "Albuquerque",
  admins: ["Gus Fring"],
  emailFrom: "gus@lospollos.hermanos",
  emailTemplates: {
    [EmailType.SendBookingsLink]: {
      subject: "prenotazioni lezioni di {{ displayName }}",
      html: `<p>Ciao {{ name }},</p>
          <p>Ti inviamo un link per prenotare le tue prossime lezioni con {{ displayName }}:</p>
          <a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>`,
    },
  },
  emailNameFrom: "Gus",
  smsFrom: "Gus",
  smsTemplate: "SMS Temp here",
  existingSecrets: ["authToken", "exampleSecret"],
};
