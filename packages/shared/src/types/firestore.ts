import { ProcessDocument } from "@eisbuk/firestore-process-delivery";

import {
  Category,
  SlotType,
  OrgSubCollection,
  Collection,
  DeliveryQueue,
  SanityCheckKind,
} from "../enums/firestore";

export interface PrivacyPolicyParams {
  prompt: string;
  learnMoreLabel: string;
  acceptLabel: string;
  policy: string;
}

/**
 * Organization data record included in each organization (other than nested collections)
 */
export interface OrganizationData {
  /**
   * List of admins
   */
  admins: string[];
  /**
   * Organization name
   */
  displayName?: string;
  /**
   * String used as `from` when sending Email.
   * If not provided, will fall back to organization name
   * @TODO this isn't yet functional, apply when making email per organization
   */
  emailFrom?: string;
  /**
   * Email to send a copy of sent Email.
   * If not provided, will fall back to emailFrom
   */
  emailBcc?: string;
  /**
   * Name to use when sending emails ( the name part in Name <email@example.com>)
   */
  emailNameFrom?: string;
  /**
   * Templates for emails (bookings link, extending date, etc.)
   */
  emailTemplates: {
    [name: string]: EmailTemplate;
  };
  /**
   * Caller ID to use when sending out SMSs
   */
  smsFrom?: string;
  /**
   * Templates for SMS messages (bookings link, extending date, etc.)
   */
  smsTemplates: {
    [name: string]: string;
  };
  /**
   * A default country code (e.g. "IT") used to get the default dial code prefix
   * for phone inputs (e.g. "+39")
   */
  defaultCountryCode?: string;
  /**
   * Record of flags inticating that given secrets exists
   * for a given organization
   */
  existingSecrets?: string[];
  /**
   * A flag determining whether smtp configuration has been setup in secrets document
   */
  smtpConfigured?: boolean;
  /**
   * Physical address of the gym, ice ring, etc. where the skating lessons are held
   */
  location?: string;
  /**
   * A short (and weak) secret used by new athletes for self registration
   */
  registrationCode?: string;
  /**
   * Data used for privacy policy compliance prompt (and the policy text iteslf)
   */
  privacyPolicy?: PrivacyPolicyParams;
}

export type EmailTemplate = {
  subject: string;
  html: string;
};

/** Organization data copied over to a new collection shared publicly */
export type PublicOrganizationData = Pick<
  OrganizationData,
  | "displayName"
  | "location"
  | "emailFrom"
  | "defaultCountryCode"
  | "privacyPolicy"
>;

// #endregion organizations

// #region secrets
/**
 * An interface of a document containing
 * secrets for each organization
 */
export interface OrganizationSecrets {
  /**
   * Auth token used to authenticate with SMS sending service provider
   */
  smsAuthToken?: string;
  /**
   * SMTP service host
   */
  smtpHost: string;
  /**
   * SMTP port (465 in most cases)
   */
  smtpPort: number;
  /**
   * SMTP service auth user
   */
  smtpUser: string;
  /**
   * SMTP service auth password
   */
  smtpPass: string;
}
// #endregion secrets

// #region slots

/**
 * Interval for booking. Includes start/end time of the interval.
 */
export interface SlotInterval {
  /**
   * Time of day of interval start.
   * Should be "HH:mm"
   * @TO_ALWAYS_DO add checks for "HH:mm" compatibility when storing to firestore
   */
  startTime: string;
  /**
   * Time of day of interval start.
   * Should be "HH:mm"
   * @TO_ALWAYS_DO add checks for "HH:mm" compatibility when storing to firestore
   */
  endTime: string;
}

/**
 * Interface for slot entry
 */
export interface SlotInterface {
  /**
   * Id of the slot (uuid generated string). Generated by the db initially.
   */
  id: string;
  /**
   * Date of the slot in ISO format, only a day, without the time of day
   * and timezone
   */
  date: string;
  /**
   * Type of activity this slot is for: `"ice" | "off_ice_dancing" | "off_ice_gym"`
   */
  type: SlotType;
  /**
   * Athlete categories this slot is suitable for.
   */
  categories: Category[];
  /**
   * Intervals available for booking. Keyed by start-end time.
   *
   * Example:
   * ```
   * ["09:00-10:30"]: {
   *    startTime: "09:00",
   *    endTime: "10:30"
   * }
   * ```
   *
   */
  intervals: {
    [key: string]: SlotInterval;
  };
  /**
   * Notes on the slot
   */
  notes?: string;
}

/** Slot interface with optional id */
export type SlotInterfaceLoose = Omit<SlotInterface, "id"> & { id?: string };

/**
 * Record of slots keyed by slot id
 */
export interface SlotsById {
  [slotId: string]: SlotInterface;
}

/**
 * Record of days (keyed by date iso string) and with
 * every day being a record of slots, keyed by slot id
 */
export interface SlotsByDay {
  [dayStr: string]: SlotsById;
}
// #endregion slots

// #region customers

/**
 * A base for customer entry: used to self register a customer, as well as the data a customer can later
 * update themselves.
 */
export interface CustomerBase {
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  birthday?: string;
  certificateExpiration?: string;
  photoURL?: string;
  privacyPolicyAccepted?: {
    timestamp: string;
  };
}
/**
 * A standard customer entry available to both the customer themself as well as to the admin's full profile view
 */
export interface Customer extends CustomerBase {
  id: string;
  secretKey: string;
  categories: Category[];
  extendedDate?: string | null;
  deleted?: boolean;
}
/**
 * A full customer structure, including all of the regular properties, plus some administration data available only
 * to admins
 */
type BookingStats = Record<SlotType, number>;
export interface CustomerFull extends Customer {
  subscriptionNumber: string;
  deleted?: boolean;
  bookingStats?: Record<string, BookingStats>;
}

/**
 * A customer interface extended with attendance data.
 */
export interface CustomerWithAttendance extends CustomerFull {
  bookedInterval: string | null;
  attendedInterval: string | null;
  bookingNotes?: string;
}

/**
 * Object with birthday prop and customer prop
 */
export interface CustomersByBirthday {
  date: string;
  customers: CustomerFull[];
}
/**
 * Customer with loose data. The server generated ids (`id`, `secretKey`)
 * are optional
 */
export type CustomerLoose = Omit<Customer, "id" | "secretKey"> &
  Partial<Pick<Customer, "id" | "secretKey">>;

// #endregion customers

// #region bookings

/**
 * Booking entry in user's bookings `bookedSlots` collection
 */
export interface CustomerBookingEntry {
  /**
   * ISO date of the booked slot (used for easier querying from store)
   */
  date: string;
  /**
   * Booked interval for particular slot
   */
  interval: string;
  /**
   * Optional personal notes for a particular booking
   */
  bookingNotes?: string;
}
/**
 * Bookings document for customer
 */
export interface CustomerBookings extends Customer {
  /**
   * Slots the customer has booked, keyed by slot id and containing `date` and `bookedInterval`
   */
  bookedSlots?: {
    [slotId: string]: CustomerBookingEntry;
  };
  /**
   * Slots the customer was marked as attended for, but hasn't booked, keyed by slot id and containing `date` and `bookedInterval`
   */
  attendedSlots?: {
    [slotId: string]: CustomerBookingEntry;
  };
}
/**
 * Bookings added to calendar
 */
export interface CalendarEvents {
  /**
   * Slots the customer has booked and added to calendar, keyed by iso date and containing uids of events booked
   */

  [monthStr: string]: { [uids: string]: string[] };
}

// #endregion bookings

// #region attendance

/**
 * Entry for attendance of single user on single slot.
 *
 * `booked` represents interval booked by the customer
 * - if customer booked, this should always be non-null
 * - if not booked by customer (attended without booking) will be `null`
 *
 * `attended` represents interval customer has attended
 * - if customer booked and didn't attend, will be `null`
 * - if not booked and not attended (customer added by mistake), won't be `null` and entry should be deleted.
 */
export interface CustomerAttendance {
  bookedInterval: string | null;
  attendedInterval: string | null;
  bookingNotes?: string;
}

/**
 * Attendance entries for a slot, used to merge with slot's base data for displaying/processing
 */
export type SlotAttendnace = {
  /**
   * ISO date of the slot for easier querying
   */
  date: string;
  /**
   * Attendances for slot keyed by customer
   */
  attendances: {
    [customerId: string]: CustomerAttendance;
  };
};

// #endregion attendance

// #region cloudSentMessages
/**
 * Interface for a single attachment in an email.
 * Email will include an optional array of these items.
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
}

/**
 * A full email interface, including:
 * `to`, `from`, `subject`, `html`, `attachments` and `bcc`
 */
export interface EmailPayload {
  to: string;
  from: string;
  bcc: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SMSMessage {
  to: string;
  message: string;
}
// #endregion cloudSentMessages

// #region sanityChecks
export interface UnpairedDoc {
  existing: OrgSubCollection[];
  missing: OrgSubCollection[];
}

/**
 * A record for a document with mismatched dates.
 */
export type DateMismatchDoc = {
  [key in OrgSubCollection]: string;
};

export type SlotAttendanceUpdate = {
  [K in keyof SlotAttendnace]?: {
    before: SlotAttendnace[K];
    after: SlotAttendnace[K];
  };
};

export interface AttendanceAutofixReport {
  timestamp: string;
  created: Record<string, SlotAttendnace>;
  deleted: Record<string, SlotAttendnace>;
  updated: Record<string, SlotAttendanceUpdate>;
}

export interface SlotAttendanceSanityCheckReport {
  /** ISO timestamp of the sanity check run */
  id: string;
  /** A record of "unpaired" docs - slot related docs missing an entry in one or more related collection (keyed by slot id) */
  unpairedEntries: Record<string, UnpairedDoc>;
  /** A record of docs for which the date is mismatched across collections (keyed by slot id) */
  dateMismatches: Record<string, DateMismatchDoc>;
  attendanceFixes?: AttendanceAutofixReport;
}

/** `<month>/<date>` string used for `slotsByDay` sanity checks */
export type DateNamespace = `${string}/${string}`;
export type SlotWithDateNamespace = SlotInterface & {
  dateNamespace: DateNamespace;
};

/** A report for mismatched 'slots' and 'slotsByDay' entries */
export interface SlotsByDayMismatchedDoc {
  /** Slot in 'slots' collection */
  slots: SlotInterface;
  /** Slot in 'slotsByDay' collection */
  slotsByDay: SlotWithDateNamespace;
}

export type SlotsByDayUpdate = {
  [K in keyof SlotInterface]?: {
    before: SlotInterface[K];
    after: SlotInterface[K];
  };
};

/** Slot id prepended with data namespace */
export type DatedSlotId = `${DateNamespace}/${string}`;
export interface SlotsByDayAutofixReport {
  timestamp: string;
  created: DatedSlotId[];
  deleted: DatedSlotId[];
  updated: Record<DatedSlotId, SlotsByDayUpdate>;
  addedIds: string[];
}

export interface SlotSlotsByDaySanityCheckReport {
  /** ISO timestamp of the sanity check run */
  id: string;
  straySlotsByDayEntries: Record<string, SlotWithDateNamespace[]>;
  missingSlotsByDayEntries: Record<string, SlotInterface>;
  mismatchedEntries: Record<string, SlotsByDayMismatchedDoc>;
  slotsByDayFixes?: SlotsByDayAutofixReport;
}

// #endregion sanityChecks

// #region firestoreSchema
/**
 * Full firestore database schema as inferred from test data
 */
export interface FirestoreSchema {
  [Collection.Organizations]: {
    [organization: string]: OrganizationData & {
      [OrgSubCollection.Slots]: { [slotId: string]: SlotInterface };
      [OrgSubCollection.SlotsByDay]: {
        [monthStr: string]: SlotsByDay;
      };
      [OrgSubCollection.Customers]: {
        [customerId: string]: CustomerFull;
      };
      [OrgSubCollection.Bookings]: CustomerBookings;
      [OrgSubCollection.Attendance]: {
        [slotId: string]: SlotAttendnace;
      };
    };
  };
  [Collection.PublicOrgInfo]: {
    [organization: string]: PublicOrganizationData;
  };
  [Collection.DeliveryQueues]: {
    [organization: string]: {
      [DeliveryQueue.EmailQueue]: {
        [id: string]: ProcessDocument<EmailPayload>;
      };
      [DeliveryQueue.SMSQueue]: {
        [id: string]: ProcessDocument<SMSMessage>;
      };
    };
  };
  [Collection.Secrets]: {
    [organization: string]: OrganizationSecrets;
  };
  [Collection.SanityChecks]: {
    [organization: string]: {
      [SanityCheckKind.SlotAttendance]: SlotAttendanceSanityCheckReport;
      [SanityCheckKind.SlotSlotsByDay]: SlotSlotsByDaySanityCheckReport;
    };
  };
}

// #endregion firestoreSchema
