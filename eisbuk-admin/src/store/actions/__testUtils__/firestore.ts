import { AnyAction, Dispatch, Store } from "redux";
import { DateTime } from "luxon";
import { doc, setDoc } from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotsByDay,
  CustomerBookings,
  Customer,
  BookingSubCollection,
  CustomerLoose,
  OrganizationData,
} from "eisbuk-shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { TestEnvFirestore } from "@/__testSetup__/getTestEnv";

import { __organization__ } from "@/lib/constants";

import { LocalStore, FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import { createTestStore } from "@/__testUtils__/firestore";
import { waitForCondition } from "@/__testUtils__/helpers";
import { getCustomerBase } from "@/__testUtils__/customers";

import { testDateLuxon } from "@/__testData__/date";

type ThunkParams = Parameters<FirestoreThunk>;

/**
 * Saved organization ref in db, to reduce excess typing
 */
const orgDb = adminDb
  .collection(Collection.Organizations)
  .doc(getOrganization());

/**
 * A stored path to test organization in firestore
 */
const orgPath = [Collection.Organizations, __organization__].join("/");
/**
 * A path to `slots` collection in test organization
 */
const slotsPath = [orgPath, OrgSubCollection.Slots].join("/");

interface AdminSetupFunction<
  T extends Record<string, any> = Record<string, never>
> {
  (
    payload: {
      db: TestEnvFirestore;
      store: Store<LocalStore, AnyAction>;
    } & T
  ): Promise<void>;
}

/**
 * Set up `organization` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @param dispatch an optional mock dispatch function (in case we want to test dispatching)
 * @returns middleware args (dispatch, setState )
 */
export const setupTestOrganziation = async ({
  organization,
  dispatch = (value: any) => value,
}: {
  organization: OrganizationData;
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  // create `getState` state to return store populated with desired values
  const getState = () =>
    createTestStore({
      data: { organizations: { [getOrganization()]: organization } },
    });

  // set desired values to emulated db
  await orgDb.set(organization);

  return [dispatch, getState];
};

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @param dispatch an optional mock dispatch function (in case we want to test dispatching)
 * @returns middleware args (dispatch, setState )
 */
export const setupTestAttendance = async ({
  attendance,
  dispatch = (value: any) => value,
}: {
  attendance: LocalStore["firestore"]["data"]["attendance"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ data: { attendance } });

  // set desired values to emulated db
  const attendanceColl = orgDb.collection(OrgSubCollection.Attendance);
  const updates = Object.keys(attendance!).map((slotId) =>
    attendanceColl.doc(slotId).set(attendance![slotId])
  );

  await Promise.all(updates);

  return [dispatch, getState];
};
/**
 * Set up `slots` data in emulated store and create `getState()` returning redux store
 * filled with `slots` data as `slotsByDay`
 * @param slots entry for firestore slots we want to set
 * @param dispatch an optional mock dispatch function (in case we want to test dispatching)
 * @param date optional date (in case we want to explicitly set the date for testing), defaults to `testDateLuxon`
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestSlots = async ({
  slots,
  dispatch = (value: any) => value,
  date = testDateLuxon,
}: {
  slots: Record<string, SlotInterface>;
  dispatch?: Dispatch;
  date?: DateTime;
}): Promise<ThunkParams> => {
  // transform slots to `slotsByDay` store entry struct:
  // get keys (month, day) from `slot.date` and organize accordingly
  const slotsByDay = aggregateSlots(slots);

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ data: { slotsByDay }, date });

  // set desired values to emulated db
  const slotsColl = orgDb.collection(OrgSubCollection.Slots);

  const updates = Object.keys(slots).map((slotId) =>
    slotsColl.doc(slotId).set(slots[slotId])
  );

  await Promise.all(updates);

  return [dispatch, getState];
};
/**
 * A @TEMP slot setup helper. Should be used instead of existing `setupTestSlots`
 * @param param0
 */
export const setupTestSlotsTemp: AdminSetupFunction<{
  slots: Record<string, SlotInterface>;
}> = async ({ db, store, slots }) => {
  // aggregate slots (to slotsByDay) and update to store
  const slotsByDay = aggregateSlots(slots);
  store.dispatch(updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay));
  // update slots to firestore
  const slotIds = Object.keys(slots);
  await Promise.all(
    slotIds.map((slotId) => setDoc(doc(db, slotsPath, slotId), slots[slotId]))
  );
};
/**
 * Create `getState()` returning redux store
 * filled with `copyPaste` data
 * @param day entry for `day` in `copyPaste` state
 * @param week entry for `week` in `copyPaste` state
 * @param dispatch an optional mock dispatch function (in case we want to test dispatching)
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupCopyPaste = async ({
  day = null,
  week = null,
  dispatch = (value: any) => value,
}: {
  day?: LocalStore["copyPaste"]["day"];
  week?: LocalStore["copyPaste"]["week"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  const copyPaste = { day, week };
  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ copyPaste });

  return [dispatch, getState];
};
/**
 * Creates a new redux store and new test environment firestore.
 * Populates both with customer's booking entry, booked slots and
 * slots created from booked slots data and customer's category
 * @param {Object} payload
 * @param {Object} payload.bookedSlots a record of `bookedSlots` for customer
 * @param {Object} payload.customer customer object
 * @param {Firestore} payload.db customer object
 * @param {Store} payload.store customer object
 */
export const setupTestBookings = async ({
  db,
  store,
  bookedSlots,
  customer,
}: {
  db: TestEnvFirestore;
  store: Store<LocalStore, AnyAction>;
  bookedSlots: Required<CustomerBookings>["bookedSlots"];
  customer: Customer;
}): Promise<void> => {
  const { secretKey } = customer;

  /** Path to customer's bookings */
  const customerBookingsPath = [
    Collection.Organizations,
    __organization__,
    OrgSubCollection.Bookings,
    secretKey,
  ].join("/");
  /** Path to booked slots collection */
  const bookedSlotsPath = [
    customerBookingsPath,
    BookingSubCollection.BookedSlots,
  ].join("/");

  const slotIds = Object.keys(bookedSlots);

  // add booked slots to test store
  store.dispatch(
    updateLocalDocuments(BookingSubCollection.BookedSlots, bookedSlots)
  );

  // update firestore starting with creating of `bookings` entry for customer
  // and adding each booked slot
  await Promise.all(
    slotIds.reduce(
      (acc, slotId) => [
        ...acc,
        setDoc(doc(db, bookedSlotsPath, slotId), bookedSlots[slotId]),
      ],
      [
        setDoc(doc(db, customerBookingsPath), getCustomerBase(customer)),
      ] as Promise<any>[]
    )
  );
};
/**
 * Set up `customers` data entry in emulated store and create `getState()` returning redux store
 * filled with same `customers` data
 * @param customer we want to set to firestore (optionally we can omit this and just return thunk args)
 * @param secretKey test `secretKey` for customer
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestCustomer = async ({
  customer,
  dispatch = (value: any) => value,
}: {
  customer: CustomerLoose;
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  const customersRef = orgDb.collection(OrgSubCollection.Customers);

  // try and use `id` from provided customer (if not defined, will be replaced later)
  let customerId = customer.id;

  if (customerId) {
    // we're immediately using the `id` (if provided) for document reference
    await customersRef.doc(customerId).set(customer);
  } else {
    // we're setting a customer to unspecified doc id (should be assigned by the server/emulator)
    await customersRef.doc().set(customer);
    // update `customerId` to a newly created one
    customerId = (await customersRef.get()).docs[0].id;
  }

  // halt the execution until customer doc has all data (`id` and `secretKey`), either provided
  // or added by data trigger
  const customerEntry = (await waitForCondition({
    documentPath: `${Collection.Organizations}/${getOrganization()}/${
      OrgSubCollection.Customers
    }/${customerId}`,
    condition: (data) => data && data.id && data.secretKey,
  })) as Customer;

  const getState = () =>
    createTestStore({
      data: {
        customers: {
          [customerId as string]: customerEntry,
        },
      },
    });

  return [dispatch, getState];
};

/**
 * A helper function used to simulate slot aggregation (creates `slotsByDay` entry).
 * Used to populate mocked local store
 * @param slots keyed by slot id
 * @returns slotsByDay
 */
const aggregateSlots = (slots: Record<string, SlotInterface>) =>
  Object.keys(slots).reduce((acc, slotId) => {
    const slot = slots[slotId];

    const { date } = slot;
    const monthStr = date.substring(0, 7);

    const slotsForMonth = acc[monthStr] || {};
    const slotsForDay = slotsForMonth[date] || {};

    return {
      ...acc,
      [monthStr]: {
        ...slotsForMonth,
        [date]: { ...slotsForDay, [slotId]: slot },
      },
    };
  }, {} as Record<string, SlotsByDay>);
