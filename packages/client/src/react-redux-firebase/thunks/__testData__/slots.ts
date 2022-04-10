import { setDoc, doc } from "@firebase/firestore";
import { DateTime } from "luxon";

import { Collection, luxon2ISODate, OrgSubCollection } from "@eisbuk/shared";

import { __organization__ } from "@/lib/constants";

import { TestEnvSetup } from "../__testUtils__/utils";

import { baseSlot } from "@/__testData__/slots";

// dates used to test subscribing with respect to range
const startDate = DateTime.fromISO("2022-01-01");
const testDates = Array(7)
  .fill(null)
  .map((_, i) => luxon2ISODate(startDate.plus({ days: i })));

// document ids used to test subscribing with doc ids
const docIds = Array(7)
  .fill(null)
  .map((_, i) => `slot-${1 + i}`);

// create test slot entries
export const testSlots = testDates.map((date, i) => ({
  ...baseSlot,
  date,
  id: docIds[i],
}));

// setup function used to set slots to firestore
export const createTestSlots: TestEnvSetup = async (db) => {
  await Promise.all(
    testSlots.map((slot) =>
      setDoc(
        doc(
          db,
          Collection.Organizations,
          __organization__,
          OrgSubCollection.Slots,
          slot.id
        ),
        slot
      )
    )
  );
};

export const slotsCollPath = [
  Collection.Organizations,
  __organization__,
  OrgSubCollection.Slots,
].join("/");
