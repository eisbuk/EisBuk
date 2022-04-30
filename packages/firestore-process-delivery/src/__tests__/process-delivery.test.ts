// import functionsTest from "firebase-functions-test";
import admin from "firebase-admin";
import { Timestamp } from "@google-cloud/firestore";

import { adminDb } from "../__testSetup__/adminDb";

import { DeliveryStatus, ProcessDocument } from "../types";

import processDelivery from "../index";

beforeEach(() =>
  Promise.all([
    adminDb.doc("queue/doc1").delete(),
    adminDb.doc("delivery/doc1").delete(),
  ])
);

afterEach(() => {
  jest.clearAllMocks();
});

// We want the transactions be ran against our test db (`adminDB`)
jest.spyOn(admin, "firestore").mockImplementation(() => adminDb);

// We might want to get function logs directly printed to the console
// as well as avoid the tests breaking because no admin app was initialized
jest.mock("firebase-functions", () => ({
  logger: console,
}));

describe("Test process delivery functionality", () => {
  test("should start the delivery process by setting the delivery state to 'PENDING' in process document", async () => {
    const processDocRef = adminDb.doc("queue/doc1");
    // Get an empty doc snapshot to be used as `change.before`
    const before = await processDocRef.get();
    await processDocRef.set({ foo: "bar" });
    const after = await processDocRef.get();

    await processDelivery({ before, after }, () => Promise.resolve());

    const resultDoc = await processDocRef.get();
    const data = resultDoc.data() as ProcessDocument;

    expect(data.delivery.status).toEqual("PENDING");
  });

  test("should process the 'PENDING' delivery and store delivery result in the process doc", async () => {
    const processDocRef = adminDb.doc("queue/doc1");
    // Set the delivery to 'PENDING' state
    await processDocRef.set({
      foo: "bar",
      delivery: {
        status: DeliveryStatus.Pending,
      } as ProcessDocument["delivery"],
    });
    const pendingDoc = await processDocRef.get();

    // Expect the delivery to be processed successfully
    // This execution also features 'PROCESSING' state, but with the resolution of the execution
    // the delivery will already be in 'SUCCESS' state
    const mockDelivery = jest.fn();
    await processDelivery(
      { before: pendingDoc, after: pendingDoc },
      async () => {
        mockDelivery();
        return "Great success";
      }
    );
    expect(mockDelivery).toHaveBeenCalledTimes(1);
    const successDoc = await processDocRef.get();
    const successDocData = successDoc.data() || {};
    expect(successDocData.delivery.status).toEqual(DeliveryStatus.Success);
    // Should store the delivery `result` to process document
    expect(successDocData.delivery.result).toEqual("Great success");
  });

  test("should store the error to process document if error occured", async () => {
    const processDocRef = adminDb.doc("queue/doc1");
    await processDocRef.set({
      foo: "bar",
      delivery: {
        status: DeliveryStatus.Pending,
      } as ProcessDocument["delivery"],
    });
    const pendingDoc = await processDocRef.get();

    const errorMessage = "Intentional test error";
    await processDelivery(
      { before: pendingDoc, after: pendingDoc },
      async () => {
        throw new Error(errorMessage);
      }
    );
    const errorDoc = await processDocRef.get();
    const errorDocData = errorDoc.data() || {};
    expect(errorDocData.delivery.status).toEqual(DeliveryStatus.Error);
    expect(errorDocData.delivery.error).toContain(errorMessage);
  });

  test("should profcess the document on 'RETRY' (set manually)", async () => {
    const processDocRef = adminDb.doc("queue/doc1");
    await processDocRef.set({
      foo: "bar",
      delivery: {
        status: DeliveryStatus.Error,
        error: ["Error: Intentional test error"],
      } as Partial<ProcessDocument["delivery"]>,
    });
    const errorDoc = await processDocRef.get();

    await processDocRef.set(
      { delivery: { status: DeliveryStatus.Retry } },
      { merge: true }
    );
    const retryDoc = await processDocRef.get();

    const successMessage = "Great success";
    await processDelivery({ before: errorDoc, after: retryDoc }, () =>
      Promise.resolve(successMessage)
    );
    const retriedDoc = await processDocRef.get();
    const retriedDocData = retriedDoc.data() || {};
    // Status should be 'SUCCESS', result stored and error cleared
    expect(retriedDocData.delivery.status).toEqual(DeliveryStatus.Success);
    expect(retriedDocData.delivery.error).toEqual(null);
    expect(retriedDocData.delivery.result).toEqual(successMessage);
  });

  test("should cancel the delivery if 'PROCESSING' and lease time expired", async () => {
    /** This is a very weird case and shouldn't really happen */

    const processDocRef = adminDb.doc("queue/doc1");
    await processDocRef.set({
      foo: "bar",
      delivery: {
        status: DeliveryStatus.Pending,
      } as ProcessDocument["delivery"],
    });
    const pendingDoc = await processDocRef.get();

    await processDocRef.set({
      foo: "bar",
      delivery: {
        status: DeliveryStatus.Processing,
        // Test with expired lease
        leaseExpireTime: Timestamp.fromMillis(Date.now() - 1000),
      } as ProcessDocument["delivery"],
    });
    const expiredDoc = await processDocRef.get();

    await processDelivery({ before: pendingDoc, after: expiredDoc }, () =>
      Promise.resolve()
    );
    const cancelledDoc = await processDocRef.get();
    const cancelledDocData = cancelledDoc.data() as ProcessDocument;
    expect(cancelledDocData.delivery.status).toEqual(DeliveryStatus.Error);
    expect(cancelledDocData.delivery.errors).toEqual([
      "Delivery processing lease expired.",
    ]);
  });
});
