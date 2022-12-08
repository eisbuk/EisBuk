import { ProcessDocument } from "@eisbuk/firestore-process-delivery";

import {
  Category,
  SlotType,
  OrgSubCollection,
  Collection,
  DeliveryQueue,
} from "../enums/firestore";

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
   * Template for reminder emails
   */
  emailTemplate?: string;
  /**
   * Caller ID to use when sending out SMSs
   */
  smsFrom?: string;
  /**
   * Template for reminder SMSs
   */
  smsTemplate?: string;
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
}

/** Organization data copied over to a new collection shared publicly */
export type PublicOrganizationData = Pick<
  OrganizationData,
  "displayName" | "location" | "emailFrom" | "defaultCountryCode"
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
 * Basic customer data used in multiple places (such as bookings customer document)
 */
export interface CustomerBase {
  id: string;
  name: string;
  surname: string;
  categories: Category[];
  /** @TODO remove when migration to categories is done */
  category?: Category[];
  photoURL?: string;
  deleted?: boolean;
  extendedDate?: string;
}
/**
 * Customer entry in the Firestore DB
 */
export interface Customer extends CustomerBase {
  secretKey: string;
  birthday?: string;
  email?: string;
  phone?: string;
  certificateExpiration?: string;
  covidCertificateReleaseDate?: string;
  covidCertificateSuspended?: boolean;
  subscriptionNumber?: string;
}
/**
 * Object with birthday prop and customer prop
 */
export interface CustomersByBirthday {
  birthday: string;
  customers: Customer[];
}
/**
 * Customer with loose data. The server generated ids (`id`, `secretKey`)
 * are optional
 */
export type CustomerLoose = Omit<Omit<Customer, "id">, "secretKey"> &
  Partial<Pick<Customer, "id"> & Pick<Customer, "secretKey">>;

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
export interface CustomerBookings extends CustomerBase {
  /**
   * Slots the customer has booked, keyed by slot id and containing `date` and `bookedInterval`
   */
  bookedSlots?: {
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
 * Interface used as `payload` in email process-delivery.
 * It's basically a full email payload without the `from` and `bcc`
 * fields (as they're loaded from organization preferences).
 */
export interface ClientEmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * A full email interface, including:
 * `to`, `from`, `subject`, `html`, `attachments` and `bcc`
 */
export interface EmailPayload extends ClientEmailPayload {
  from: string;
  bcc: string;
}

/**
 * A payload used in `sendEmail` cloud function.
 */
export interface ClientSendEmailPayload extends ClientEmailPayload {
  /**
   * Used to identify an organization where the email is sent from,
   * as well as which organization to authenticate against.
   */
  organization: string;
  /**
   * Alternative authentication to enable customers (unauthenticated, but in possession of `secretKey`)
   * send emails as well. (recovery emails, etc.)
   */
  secretKey?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
}
// #endregion cloudSentMessages

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
        [customerId: string]: Customer;
      };
      [OrgSubCollection.Bookings]: {
        [secretKey: string]: CustomerBookings;
      };
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
}

// #endregion firestoreSchema
