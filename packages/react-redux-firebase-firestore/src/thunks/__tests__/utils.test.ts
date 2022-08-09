import { CollectionSubscription } from "../../types";

import { createGetDocsInStore } from "../utils";

describe("Firestore subscriptions", () => {
  describe("createGetDocsInStore util", () => {
    test("should return docs with belonging to appropriate range with appropriate inclusivity", () => {
      const collection = "test-collection" as CollectionSubscription;
      const range = ["date", "2022-01-02", "2022-01-04"] as [
        string,
        string,
        string
      ];

      const testEntries = {
        lessThanRange: { date: "2022-01-01" },
        atRangeStart: { date: "2022-01-02" },
        atMidRange: { date: "2022-01-03" },
        atRangeEnd: { date: "2022-01-04" },
        greaterThanRange: { date: "2022-01-05" },
      };

      const getState = () =>
        ({
          firestore: { data: { [collection]: testEntries } },
        } as any);

      const getInclusiveRange = createGetDocsInStore(collection, getState, {
        range,
      });
      const getInclusiveStart = createGetDocsInStore(
        collection,
        getState,
        { range },
        [true, false]
      );
      const getInclusiveEnd = createGetDocsInStore(
        collection,
        getState,
        { range },
        [false, true]
      );
      const getExclusiveRange = createGetDocsInStore(
        collection,
        getState,
        { range },
        [false, false]
      );

      expect(getInclusiveRange()).toEqual([
        "atRangeStart",
        "atMidRange",
        "atRangeEnd",
      ]);
      expect(getInclusiveStart()).toEqual(["atRangeStart", "atMidRange"]);
      expect(getInclusiveEnd()).toEqual(["atMidRange", "atRangeEnd"]);
      expect(getExclusiveRange()).toEqual(["atMidRange"]);
    });
  });
});
