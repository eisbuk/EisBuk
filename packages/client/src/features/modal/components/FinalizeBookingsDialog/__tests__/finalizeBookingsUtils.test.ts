import { describe, vi, expect } from "vitest";
import { Customer } from "@eisbuk/shared";

import { getCustomerDocPath } from "@/utils/firestore";
import * as getters from "@/lib/getters";

import { setUpOrganization } from "@/__testSetup__/firestore";
import { adminDb, functions } from "@/__testSetup__/firestoreSetup";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { saul } from "@eisbuk/testing/customers";
import { finalizeBookings } from "../utils";

describe("Finalize bookings dialog utils", () => {
  describe("finalizeBookings", () => {
    testWithEmulator(
      "should remove extended bookings from firestore",
      async () => {
        const { organization } = await setUpOrganization();
        const saulRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
        saulRef.set({ ...saul, extendedDate: "2022-01-01" } as Customer);
        // We want the tests to use test organization rather than the default one
        vi.spyOn(getters, "getOrganization").mockReturnValue(organization);
        await finalizeBookings(functions, saul.id, saul.secretKey);
        const { extendedDate } = (await saulRef.get()).data() as Customer;
        expect(extendedDate).toBeFalsy();
      }
    );
  });
});
