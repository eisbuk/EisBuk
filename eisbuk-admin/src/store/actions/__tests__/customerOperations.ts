import { testWithEmulator } from "@/__testUtils__/envUtils";

import { updateCustomer } from "../customerOperations";

import { saul } from "@/__testData__/customers";

describe("CustomerOperations", () => {
  describe("Test updateCustomer", () => {
    testWithEmulator(
      "should create a new entry in 'customers' collection (with server assigned id)",
      () => {
        const testCustomer = saul;
      }
    );
  });
});
