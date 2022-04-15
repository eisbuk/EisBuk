/**
 * @jest-environment node
 */

import { __testOrganization__ } from "@/__testSetup__/envData";

import { listOrgs } from "@eisbuk/firestore";

it("Lists all existing organizations", async () => {
  const orgs = await listOrgs();

  expect(orgs.length).toBe(1);
  expect(orgs[0]).toBe(__testOrganization__);
});
