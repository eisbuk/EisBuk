import {
  Category,
  SlotType,
  OrgSubCollection,
  Collection,
} from "../enums/firestore";

// #region organizations
/** @TODO Uncomment this when we find a way to add organization templates for server emails */
// /**
//  * A config to be used for mail service, including mailing server
//  * config as well as message template
//  */
// export interface OrgMailConfig {
//   /**
//    * SMTP transporter config for nodemailer
//    */
//   config: {
//     host: string;
//     port: number;
//     auth: { user: string; pass: string };
//   };
//   /**
//    * Template data for all emails sent from organization
//    */
//   template: {
//     /**
//      * Received email will show this address as `from`.
//      *
//      * _note: doesn't work with gmail, as gmail always uses the authenticated user as `from`_
//      */
//     from: string;
//     /**
//      * A subject for email template (i.e. "Link to manage your bookings")
//      */
//     subject: string;
//   };
// }

/**
 * Organization data record included in each organization (other than nested collections)
 */
export interface OrganizationData {
  admins: string[];
  organizationName?: string;
  emailNameFrom?: string;
  emailFrom?: string;
  emailTemplate?: string;
  smsFrom?: string;
  smsTemplate?: string;
  smtpUri?: string;
}

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
  notes: string;
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
  category: Category;
  // eslint-disable-next-line camelcase
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
  deleted?: boolean;
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
export interface EmailMessage {
  to: string;
  message: {
    subject: string;
    html: string;
  };
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
  [Collection.Secrets]: {
    [organization: string]: OrganizationSecrets;
  };
  [Collection.EmailQueue]: {
    [id: string]: EmailMessage;
  };
}

// #endregion firestoreSchema
