/**
 * @jest-environment node
 */
import admin from "firebase-admin";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { defaultUser } from "../__testData__/customers";

import * as restoreService from "../restore";

const __testOrganization__ = "Random Test Org";

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

beforeAll(async () => {
  await deleteAll();
});

afterEach(async () => {
  await deleteAll();
});

afterAll(() => {
  jest.resetAllMocks();
})

describe("Restore service", () => {
  it("Sets organisation document data", async () => {
    const orgData = {
      id: __testOrganization__,
      data: { admins: [defaultUser.email] },
    };

    const res = await restoreService.setOrgRootData(orgData);

    if (res.ok === true) {
      expect(res.data).toBe("OK");
    } else {
      fail(res.message);
    }
  });
});
