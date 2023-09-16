import { AnyAction, Store } from "redux";
import { v4 as uuid } from "uuid";

import {
  OrgSubCollection,
  SlotInterface,
  SlotsByDay,
  CustomerBookings,
  Customer,
  BookingSubCollection,
  sanitizeCustomer,
  SlotAttendnace,
  CustomerFull,
} from "@eisbuk/shared";

import { TestEnvFirestore } from "@/__testSetup__/firestore";

import { LocalStore } from "@/types/store";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import {
  setSlotDayToClipboard,
  setSlotWeekToClipboard,
} from "@/store/actions/copyPaste";
import {
  getAttendanceDocPath,
  getBookedSlotDocPath,
  getBookingsDocPath,
  getCustomerDocPath,
  getSlotDocPath,
  doc,
  setDoc,
} from "@/utils/firestore";

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
 * Set up `attendance` data in emulated store and populate local collection accordingly
 */
export const setupTestAttendance: AdminSetupFunction<{
  attendance: Record<string, SlotAttendnace>;
  organization: string;
}> = async ({ attendance, db, store, organization }) => {
  // set attendance to store
  store.dispatch(updateLocalDocuments(OrgSubCollection.Attendance, attendance));

  // set desired values to emulated db
  const updates = Object.keys(attendance).map((slotId) =>
    setDoc(
      doc(db, getAttendanceDocPath(organization, slotId)),
      attendance[slotId]
    )
  );

  await Promise.all(updates);
};
/**
 * Set up `slots` data in emulated store and populate redux store
 * with given `slots` data in `slotsByDay` format
 */
export const setupTestSlots: AdminSetupFunction<{
  slots: Record<string, SlotInterface>;
  organization: string;
}> = async ({ db, store, slots, organization }) => {
  // aggregate slots (to slotsByDay) and update to store
  const slotsByDay = aggregateSlots(slots);
  store.dispatch(updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay));
  // update slots to firestore
  const slotIds = Object.keys(slots);
  await Promise.all(
    slotIds.map((slotId) =>
      setDoc(doc(db, getSlotDocPath(organization, slotId)), slots[slotId])
    )
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
 * Set up `bookings` data in emulated store and populate redux store
 * with given and `bookings` customer doc and `bookedSlots`
 */
export const setupTestBookings: AdminSetupFunction<{
  bookedSlots: Required<CustomerBookings>["bookedSlots"];
  customer: Customer;
  organization: string;
}> = async ({
  db,
  store,
  bookedSlots,
  customer,
  organization,
}): Promise<void> => {
  const { secretKey } = customer;

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
        setDoc(
          doc(db, getBookedSlotDocPath(organization, secretKey, slotId)),
          bookedSlots[slotId]
        ),
      ],
      [
        setDoc(
          doc(db, getBookingsDocPath(organization, secretKey)),
          sanitizeCustomer(customer)
        ),
      ] as Promise<any>[]
    )
  );
};
/**
 * Set up `customers` data entry in emulated store in redux store
 */
export const setupTestCustomer: AdminSetupFunction<{
  customer: Partial<CustomerFull>;
  organization: string;
}> = async ({ customer, db, store, organization }) => {
  // id customer id or secretKey not provided, generate locally
  const id = customer.id || uuid();
  const secretKey = customer.secretKey || uuid();
  const customerEntry = { ...customer, id, secretKey };

  // udpate firestore
  await setDoc(doc(db, getCustomerDocPath(organization, id)), customerEntry);

  // set customer to the store
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.Customers, {
      [id]: customerEntry,
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
