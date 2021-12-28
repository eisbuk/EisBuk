import { Dispatch } from "redux";
import { DateTime } from "luxon";

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

import { LocalStore, FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";
import { adminDb } from "@/__testSetup__/firestoreSetup";

import { createTestStore } from "@/__testUtils__/firestore";

import { testDateLuxon } from "@/__testData__/date";
import { waitForCondition } from "@/__testUtils__/helpers";

type ThunkParams = Parameters<FirestoreThunk>;

/**
 * Saved organization ref in db, to reduce excess typing
 */
const orgDb = adminDb
  .collection(Collection.Organizations)
  .doc(getOrganization());

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
 * Set up `bookings` data in emulated store and create `getState()` returning redux store
 * filled with `bookedSlots` for customer
 * @param bookedSlots entry for firestore `bookedSlots` for customer (keyed by provided `secretKey`) we want to set
 * @param secretKey test `secretKey` for customer
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestBookings = async ({
  bookedSlots,
  secretKey,
  dispatch = (value: any) => value,
}: {
  bookedSlots: Required<CustomerBookings>["bookedSlots"];
  secretKey: Customer["secretKey"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  // We're creating an empty store to comply with the type interface
  const getState = () => createTestStore({});

  // saved ref for customer's `bookings` doc
  const bookingsRef = orgDb
    .collection(OrgSubCollection.Bookings)
    .doc(secretKey);

  // set booked slots to emulated store
  const bookingsToUpdate = Object.keys(bookedSlots).map((slotId) =>
    bookingsRef
      .collection(BookingSubCollection.BookedSlots)
      .doc(slotId)
      .set(bookedSlots[slotId])
  );
  await Promise.all(bookingsToUpdate);

  return [dispatch, getState];
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
    const monthStr = date.substr(0, 7);

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
