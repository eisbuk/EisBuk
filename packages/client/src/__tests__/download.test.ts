/**
 * @jest-environment node
 */

import { __testOrganization__ } from "@/__testSetup__/envData";

import { getOrgs } from "@eisbuk/firestore";

it("Lists all existing organizations", async () => {
  const result = await getOrgs();

  if (result.ok) {
    const orgs = result.data;

    const numOfOrgs = orgs.length;
    const isIncludesTestOrg = orgs
      .map(({ id }) => id)
      .includes(__testOrganization__);

    expect(numOfOrgs).toBeGreaterThan(0);
    expect(isIncludesTestOrg).toBe(true);
  } else {
    fail(result.message);
  }
});
