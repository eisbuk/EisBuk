/**
 * @jest-environment node
 */

import { defaultUser } from "@/__testSetup__/envData";

import { restoreService } from "@eisbuk/firestore";

const __testOrganization__ = "Random Test Org";

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
