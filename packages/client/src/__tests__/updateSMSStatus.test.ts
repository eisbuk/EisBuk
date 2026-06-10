/**
 * @vitest-environment node
 */

import { v4 as uuid } from "uuid";
import { describe, expect } from "vitest";

import { Collection, DeliveryQueue } from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { testWithEmulator } from "@/__testUtils__/envUtils";

/**
 * URL of the `updateSMSStatus` https endpoint in the functions emulator,
 * the same way GatewayAPI would call it (id/organization as query params).
 */
const getUpdateSMSStatusUrl = (params?: { id: string; organization: string }) =>
  `http://127.0.0.1:5002/eisbuk/europe-west6/updateSMSStatus${
    params
      ? `?id=${encodeURIComponent(params.id)}&organization=${encodeURIComponent(
          params.organization,
        )}`
      : ""
  }`;

const getSMSProcessDocPath = (organization: string, id: string) =>
  [Collection.DeliveryQueues, organization, DeliveryQueue.SMSQueue, id].join(
    "/",
  );

describe("updateSMSStatus", () => {
  testWithEmulator(
    "should store the delivery status (sent as query params + body, like GatewayAPI does) to the SMS process document",
    async () => {
      const organization = uuid();
      const id = uuid();

      // Set up an SMS process document (as if an SMS had been sent out)
      const processDocRef = adminDb.doc(getSMSProcessDocPath(organization, id));
      await processDocRef.set({ payload: { to: "+385991111111" } });

      const res = await fetch(getUpdateSMSStatusUrl({ id, organization }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      expect(res.status).toEqual(200);

      const processDoc = await processDocRef.get();
      expect(processDoc.data()?.delivery?.meta?.status).toEqual("DELIVERED");
    },
  );

  testWithEmulator(
    "should respond 400 (and not write anything) when id/organization query params are missing",
    async () => {
      const res = await fetch(getUpdateSMSStatusUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      expect(res.status).toEqual(400);

      // Regression: the handler used to fall through after the 400 and write
      // a junk document to 'deliveryQueues/undefined/SMSQueue/undefined'
      const junkDoc = await adminDb
        .doc(getSMSProcessDocPath("undefined", "undefined"))
        .get();
      expect(junkDoc.exists).toEqual(false);
    },
  );

  testWithEmulator(
    "should respond 400 when no status is received in the request body",
    async () => {
      const organization = uuid();
      const id = uuid();

      const res = await fetch(getUpdateSMSStatusUrl({ id, organization }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);

      const processDoc = await adminDb
        .doc(getSMSProcessDocPath(organization, id))
        .get();
      expect(processDoc.exists).toEqual(false);
    },
  );
});
