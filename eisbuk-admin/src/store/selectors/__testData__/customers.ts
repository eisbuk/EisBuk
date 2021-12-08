import { LocalStore } from "@/types/store";

import { createTestStore } from "@/__testUtils__/firestore";
import { saul, walt, jian } from "@/__testData__/customers";

/**
 * A customers store input
 */
const customers: LocalStore["firestore"]["data"]["customers"] = {
  [saul.secretKey]: saul,
  [jian.secretKey]: jian,
  [walt.secretKey]: walt,
};

export const expectedCustomersBirthdays = {
  "01/01": [saul, jian, walt],
};

/**
 * Test store populated with customers we're using to test the selector
 */
export const testStore = createTestStore({
  data: { customers },
});
