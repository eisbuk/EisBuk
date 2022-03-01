import { CustomerRoute } from "@/enums/routes";
import { splitSlotsByCustomerRoute } from "../utils";

import {
  dummySlotsFromStore,
  dummySlotsSplitByRoute,
} from "../__testData__/dummyData";

describe("'/customers' page", () => {
  describe("Test utils: 'splitSlotsByCustomerRoute'", () => {
    test("should return record of slotsByDay for `book_ice` and `book_off_ice` type", () => {
      const groupedSlots = splitSlotsByCustomerRoute(
        dummySlotsFromStore as any
      );
      expect(groupedSlots).toEqual(dummySlotsSplitByRoute);
    });

    test("should not explode if passed an empty object", () => {
      const groupedSlots = splitSlotsByCustomerRoute({});
      expect(groupedSlots).toEqual({
        [CustomerRoute.BookIce]: {},
        [CustomerRoute.BookOffIce]: {},
        [CustomerRoute.Calendar]: {},
      });
    });
  });
});
