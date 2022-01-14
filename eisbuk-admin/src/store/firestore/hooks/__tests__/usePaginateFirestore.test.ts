import { DateTime } from "luxon";
import { waitFor } from "@testing-library/react";

import { OrgSubCollection } from "eisbuk-shared";

import { getNewStore } from "@/store/createStore";

import usePaginateFirestore from "../usePaginateFirestore";
import useFirestoreSubscribe from "../useFirestoreSubscribe";

import { changeCalendarDate } from "@/store/actions/appActions";

import { getFirestoreListeners } from "@/store/firestore/selectors";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";
import { testHookWithRedux } from "@/__testUtils__/testHooksWithRedux";

jest.mock("@firebase/firestore", () => ({
  ...jest.requireActual("@firebase/firestore"),
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: () => jest.fn(),
}));

const startDate = DateTime.fromISO("2022-01-01");
const startRange = ["date", "2021-12-01", "2022-02-28"];
const startDocumentRange = ["2021-12", "2022-01", "2022-02"];

describe("Firestore subscriptions", () => {
  describe("usePaginateFirestore", () => {
    testWithMutationObserver(
      "should update range for range constrained collections in firestore on date change",
      async () => {
        // set up test state
        const store = getNewStore();
        store.dispatch(changeCalendarDate(startDate));
        testHookWithRedux(store, useFirestoreSubscribe, [
          OrgSubCollection.Attendance,
        ]);
        // wait for listeners to update with initial `range`
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.Attendance]?.range).toEqual(
            startRange
          );
        });
        // paginate to next month to update `range`
        testHookWithRedux(store, usePaginateFirestore);
        const nextMonth = startDate.plus({ months: 1 });
        store.dispatch(changeCalendarDate(nextMonth));
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.Attendance]?.range).toEqual([
            "date",
            "2021-12-01",
            "2022-03-31",
          ]);
        });
      }
    );

    testWithMutationObserver(
      "should update documents with next month for document constrained collections (slotsByDay) in firestore on date change",
      async () => {
        // set up test state
        const store = getNewStore();
        store.dispatch(changeCalendarDate(startDate));
        testHookWithRedux(store, useFirestoreSubscribe, [
          OrgSubCollection.SlotsByDay,
        ]);
        // wait for listeners to update with initial `documents` constraint
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.SlotsByDay]?.documents).toEqual(
            startDocumentRange
          );
        });
        // paginate to next month to update `documents`
        testHookWithRedux(store, usePaginateFirestore);
        const nextMonth = startDate.plus({ months: 1 });
        store.dispatch(changeCalendarDate(nextMonth));
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.SlotsByDay]?.documents).toEqual([
            ...startDocumentRange,
            "2022-03",
          ]);
        });
      }
    );

    testWithMutationObserver(
      "should not update constraints (range nor documents) if paginating within same month (as constraints are created with respect to month)",
      async () => {
        const startDate = DateTime.fromISO("2022-01-01");
        // set up test state
        const store = getNewStore();
        store.dispatch(changeCalendarDate(startDate));
        // subscribe to both `range` constrained ("attendance")
        // and `documents` constrained ("slotsByDay") collections
        testHookWithRedux(store, useFirestoreSubscribe, [
          OrgSubCollection.Attendance,
          OrgSubCollection.SlotsByDay,
        ]);
        // wait for listeners to update with initial range
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.Attendance]?.range).toEqual(
            startRange
          );
          expect(listeners[OrgSubCollection.SlotsByDay]?.documents).toEqual(
            startDocumentRange
          );
        });
        // paginate to next week
        testHookWithRedux(store, usePaginateFirestore);
        const nextMonth = startDate.plus({ weeks: 1 });
        store.dispatch(changeCalendarDate(nextMonth));
        // give some time for listeners to update (which it shouldn't)
        await new Promise<void>((res) => setTimeout(() => res(), 200));
        // no constraints should get updated
        await waitFor(() => {
          const listeners = getFirestoreListeners(store.getState());
          expect(listeners[OrgSubCollection.Attendance]?.range).toEqual(
            startRange
          );
          expect(listeners[OrgSubCollection.SlotsByDay]?.documents).toEqual(
            startDocumentRange
          );
        });
      }
    );
  });
});
