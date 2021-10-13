import * as firestore from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";
import { db } from "@/tests/settings";

import { LocalStore } from "@/types/store";

import { subscribe } from "../subscriptionHandlers";
import { updateLocalColl } from "../actionCreators";

import { store } from "@/store/store";

import { testDate, testDateLuxon } from "@/__testData__/date";
import { baseSlot } from "@/__testData__/dummyData";
import { slotId } from "@/__testData__/dataTriggers";

const getFirestore = () => db;
jest.spyOn(firestore, "getFirestore").mockImplementation(getFirestore);

const onSnapshotSpy = jest.spyOn(firestore, "onSnapshot");

describe("Firestore subscription handlers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("test subscribing to slotsByDay", () => {
    test("should subscribe to documents for previous, current, and following month", () => {
      const slotsByDayPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.SlotsByDay}`;
      // call the function
      subscribe({
        coll: OrgSubCollection.SlotsByDay,
        currentDate: testDateLuxon,
        dispatch: jest.fn(),
      });
      // create references to prev, curr and next month documents
      const expectedSubscriptions = [-1, 0, 1].map((delta) => {
        const monthStr = testDateLuxon
          .plus({ months: delta })
          .toISODate()
          .substr(0, 7);
        return firestore.doc(getFirestore(), `${slotsByDayPath}/${monthStr}`);
      });
      // get docs subscribed within tests -> first param of `onSnapshot` calls
      const subscribedDocs = onSnapshotSpy.mock.calls.map(([doc]) => doc);
      expect(subscribedDocs).toEqual(expectedSubscriptions);
    });

    test("should return unified unsubscribe function, which fires all (3) unsubscribe functions for subscribed documents", () => {
      const unsubscribeFunctions = Array(3)
        .fill(null)
        .map(() => jest.fn()) as jest.Mock<any, any>[];
      // we want for each call to `onSnspshot` to return one mock unsub function
      unsubscribeFunctions.forEach((unsubFunc) => {
        onSnapshotSpy.mockImplementationOnce(() => unsubFunc);
      });
      // call the function and it's returned (unsub function)
      const unsubAll = subscribe({
        currentDate: testDateLuxon,
        dispatch: jest.fn(),
        coll: OrgSubCollection.SlotsByDay,
      });
      unsubAll();
      unsubscribeFunctions.forEach((unsubFunc) =>
        expect(unsubFunc).toHaveBeenCalledTimes(1)
      );
    });

    test("should update month's slostByDay entry in local store on month's documet change", () => {
      // set up test data
      const prevMonthStart = testDateLuxon
        .plus({ months: -1 })
        .startOf("month")
        .toISODate();
      const prevMonthString = prevMonthStart.substr(0, 7);
      const initialSlotsByDay = {
        [prevMonthString]: {
          [prevMonthStart]: {
            ["dummy-slot"]: baseSlot,
          },
        },
      };
      const monthString = testDate.substr(0, 7);
      const monthEntry = { [testDate]: { [slotId]: baseSlot } };
      /**
       * A full update we're mocking to simulate document `snapshot` on snapshot update
       */
      const documentUpdate = { id: monthString, data: () => monthEntry };
      // set up test state
      store.dispatch(
        updateLocalColl(OrgSubCollection.SlotsByDay, initialSlotsByDay)
      );
      /*
       * 1. We're mocking the execution of `onSnapshot` to immideately run with our dummy month-slots-entry
       *    to test out the proper updating of the store
       * 2. This function should be ran three times. It will, however be ran idempotently
       *    since each run will update the same month entry (due to same mockImplementation)
       */
      onSnapshotSpy.mockImplementation((_, callback) => {
        // some TypeScript ninjitsu because firestore has multiple `onSnapshot` functions declared
        // not all of which have a second param callable
        (callback as any)(documentUpdate) as any;
        // we're returning an empty function (as a ) not to break the tests
        return () => {};
      });
      // call the function
      subscribe({
        currentDate: testDateLuxon,
        dispatch: store.dispatch,
        coll: OrgSubCollection.SlotsByDay,
      })();
      const updatedState = (store.getState() as LocalStore).firestore.data
        .slotsByDay;
      // the firestore entry should be the same with only test month updated
      expect(updatedState).toEqual({
        ...initialSlotsByDay,
        [monthString]: monthEntry,
      });
    });
  });
});
