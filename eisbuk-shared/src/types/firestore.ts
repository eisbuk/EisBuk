import {
  Category,
  SlotType,
  OrgSubCollection,
  Collection,
} from "../enums/firestore";

// #region organizations

/**
 * Metadata record included in each organization (other than nested collections)
 */
export interface OrganizationMeta {
  admins: string[];
}

// #endregion organizations

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
  birthday: string;
  email: string;
  phone: string;
  certificateExpiration?: string;
  covidCertificateReleaseDate?: string;
  covidCertificateSuspended?: boolean;
  deleted?: boolean;
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

// #region firestoreSchema

/**
 * Full firestore database schema as inferred from test data
 */
export interface FirestoreSchema {
  [Collection.Organizations]: {
    [organization: string]: OrganizationMeta & {
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
}

// #endregion firestoreSchema
