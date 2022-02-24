import { AnyAction, Dispatch, Store } from "redux";
import { doc, setDoc, addDoc, collection, getDoc } from "@firebase/firestore";
import pRetry from "p-retry";
import { v4 as uuid } from "uuid";

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
  getCustomerBase,
  SlotAttendnace,
} from "eisbuk-shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { TestEnvFirestore } from "@/__testSetup__/getTestEnv";

import { __organization__ } from "@/lib/constants";

import { LocalStore, FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import {
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "@/store/actions/copyPaste";

import { createTestStore } from "@/__testUtils__/firestore";

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
/**
 * A path to `customers` collection in test organization
 */
const customersPath = [orgPath, OrgSubCollection.Customers].join("/");
/*
 * A path to `slots` collection in test organization
 */
const attendancePath = [orgPath, OrgSubCollection.Attendance].join("/");

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
 * Set up `attendance` data in emulated store and populate local collection accordingly
 */
export const setupTestAttendance: AdminSetupFunction<{
  attendance: Record<string, SlotAttendnace>;
}> = async ({ attendance, db, store }) => {
  // set attendance to store
  store.dispatch(updateLocalDocuments(OrgSubCollection.Attendance, attendance));

  // set desired values to emulated db
  const attendanceCollRef = collection(db, attendancePath);
  const updates = Object.keys(attendance).map((slotId) =>
    setDoc(doc(attendanceCollRef, slotId), attendance[slotId])
  );

  await Promise.all(updates);
};
/**
 * Set up `slots` data in emulated store and populate redux store
 * with given `slots` data in `slotsByDay` format
 */
export const setupTestSlots: AdminSetupFunction<{
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
export const setupCopyPaste: AdminSetupFunction<{
  day?: LocalStore["copyPaste"]["day"];
  week?: LocalStore["copyPaste"]["week"];
}> = async ({ day, week, store }) => {
  // create `getState` state to return store populated with desired values
  if (day) {
    store.dispatch(setSlotDayToClipboard(day));
  }
  if (week) {
    store.dispatch(setSlotWeekToClipboard(week));
  }
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
 * Set up `customers` data entry in emulated store in redux store
 */
export const setupTestCustomer: AdminSetupFunction<{
  customer: CustomerLoose;
}> = async ({ customer, db, store }) => {
  const customersRef = collection(db, customersPath);

  // id customer id or secretKey not provided, generate locally
  const id = customer.id || uuid();
  const secretKey = customer.secretKey || uuid();
  const customerEntry = { ...customer, id, secretKey };

  // udpate firestore
  await setDoc(doc(customersRef, id), customerEntry);

  // set customer to the store
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.Customers, {
      [id]: customerEntry,
    })
  );
};

export const setupTestCustomerTemp: AdminSetupFunction<{ customer: Customer }> =
  async ({ customer, store, db }) => {
    // try and use `id` from provided customer (if not defined, will be replaced later)
    let customerId = customer.id;

    if (customerId) {
      // we're immediately using the `id` (if provided) for document reference
      await setDoc(doc(db, customersPath, customerId), customer);
    } else {
      // we're setting a customer to unspecified doc id (should be assigned by the server/emulator)
      const newCustomerEntry = await addDoc(
        collection(db, customersPath),
        customer
      );
      // update `customerId` to a newly created one
      customerId = newCustomerEntry.id;
    }

    // halt the execution until customer doc has all data (`id` and `secretKey`), either provided
    // or added by data trigger
    const customerEntry = await pRetry(
      async () => {
        const customer = (
          await getDoc(doc(db, customersPath, customerId))
        ).data();
        if (customer?.secretKey && customer?.id) {
          return Promise.resolve(customer);
        }
        return Promise.reject(new Error("Updating customer unsuccessful"));
      },
      { retries: 5 }
    );

    // set customer to local store
    store.dispatch(
      updateLocalDocuments(OrgSubCollection.Customers, {
        [customerId]: customerEntry,
      })
    );
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
