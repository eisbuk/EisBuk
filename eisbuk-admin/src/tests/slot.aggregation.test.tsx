import firebase from "firebase";

import { db } from "./settings";
import { adminDb } from "./settings";
import {
  deleteAll,
  deleteAllCollections,
  loginDefaultUser,
  createDefaultOrg,
  retry,
} from "./utils";

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentData = firebase.firestore.DocumentData;

beforeEach(async () => {
  await deleteAll(["slots", "slotsByDay"]);
  await deleteAllCollections(adminDb, ["organizations"]);
});

it("updates the slots summary on slot creation", async () => {
  await Promise.all([createDefaultOrg(), loginDefaultUser()]);
  const org = db.collection("organizations").doc("default");
  // 1611964800 → Saturday, January 30, 2021 0:00:00 GMT
  const day = 1611964800;

  // Create a slot
  const slot = org.collection("slots").doc("testSlot");
  await slot.set({
    date: { seconds: day + 15 * 3600 },
    type: "ice",
    durations: [60, 90, 120],
    categories: ["agonismo", "preagonismo"],
  });
  // Now check that the aggregate collection has been updated
  const aggregateSlotsQuery = org.collection("slotsByDay").doc("2021-01");
  var aggregateSlot = await waitForRecord({
    record: aggregateSlotsQuery,
    numKeys: 1,
  });
  expect(aggregateSlot["2021-01-30"].testSlot.type).toStrictEqual("ice");

  // Create another slot on the previous day
  const anotherSlot = org.collection("slots").doc("anotherSlot");
  await anotherSlot.set({
    date: { seconds: day - 15 * 3600 },
    type: "ice",
    durations: [60, 90, 120],
    categories: ["agonismo", "preagonismo"],
  });
  aggregateSlot = await waitForRecord({
    record: aggregateSlotsQuery,
    numKeys: 2,
  });
  expect(aggregateSlot["2021-01-29"].anotherSlot.type).toStrictEqual("ice");
  expect(aggregateSlot["2021-01-29"].anotherSlot.id).toStrictEqual(
    "anotherSlot"
  );
  expect(Object.keys(aggregateSlot["2021-01-29"]).length).toStrictEqual(1);
  expect(Object.keys(aggregateSlot["2021-01-30"]).length).toStrictEqual(1);

  // Remove one slot and make sure it's no longer in the aggregated record
  await anotherSlot.delete();
  // Create a third slot in a different day
  const thirdSlot = org.collection("slots").doc("thirdSlot");
  await thirdSlot.set({
    date: { seconds: day - 72 * 3600 },
    type: "ice",
    durations: [60, 90, 120],
    categories: ["agonismo", "preagonismo"],
  });

  aggregateSlot = await waitForRecord({
    record: aggregateSlotsQuery,
    numKeys: 3,
  });
});

interface WaitForRecord {
  (params: {
    record: DocumentReference;
    numKeys: number;
  }): Promise<DocumentData>;
}

const waitForRecord: WaitForRecord = async ({ record, numKeys }) => {
  // retry to get the given record until it contains the expected number of keys
  return await retry(
    // Try to fetch the aggregate slots for the day until
    // we find the newly added one
    async () => {
      var aggregateSlot = (await record.get()).data();
      if (!aggregateSlot || Object.keys(aggregateSlot).length !== numKeys) {
        return Promise.reject(
          new Error(`The aggregated slot with ${numKeys} keys was not found`)
        );
      }
      return aggregateSlot;
    },
    10, // Try the above up to 10 times
    400 // pause 400 ms between tries
  );
};
