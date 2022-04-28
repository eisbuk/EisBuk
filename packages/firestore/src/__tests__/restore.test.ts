/**
 * @jest-environment node
 */
import admin from "firebase-admin";

import { adminDb } from "../__testSetup__/adminDb";
import { deleteAll } from "../__testUtils__/deleteAll";
import { defaultUser } from "../__testData__/customers";

import { Collection } from "@eisbuk/shared";

import * as restoreService from "../restore";

const __testOrganization__ = "test-organization-2";

jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);
jest.spyOn(admin, "initializeApp").mockImplementation((() => {}) as any);

afterEach(async () => {
  await deleteAll();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe("Restore service", () => {
  it("Sets organization document data", async () => {
    const orgId = __testOrganization__;
    const orgData = { admins: [defaultUser.email] };

    const orgPath = `${Collection.Organizations}/${orgId}`;
    const orgPayload = {
      id: orgId,
      data: orgData,
    };

    const res = await restoreService.setOrgRootData(orgPayload);

    if (res.ok === true) {
      const result = await adminDb.doc(orgPath).get();
      const resultData = result.data();

      expect(resultData).toEqual(orgData);
    } else {
      throw new Error(res.message);
    }
  });
});
