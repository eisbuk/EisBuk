import { groupByCustomerRoute } from "../utils";

import {
  dummySlotsFromStore,
  dummySlotsSplitByRoute,
} from "../__testData__/dummyData";

describe("'/customers' page", () => {
  describe("Test utils: 'groupByCustomerRoute'", () => {
    test("should organize by type", () => {
      const groupedSlots = groupByCustomerRoute(dummySlotsFromStore);
      expect(groupedSlots).toEqual(dummySlotsSplitByRoute);
    });
  });
});
