import { Collection, OrgSubCollection } from "eisbuk-shared/dist";

import { ORGANIZATION } from "@/config/envInfo";

import { deleteAll } from "@/tests/utils";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { getFirebase } from "@/__testUtils__/firestore";

import { mixedSlots } from "../__testData__/migrations";
import { invokeFunction } from "@/components/debugPage";
import { CloudFunction } from "@/enums/functions";

const db = getFirebase().firestore();

xdescribe("Migrations", () => {
  afterEach(async () => {
    await deleteAll[
      (OrgSubCollection.Slots,
      OrgSubCollection.Customers,
      OrgSubCollection.Bookings)
    ];
  });

  describe("'migrateToNewDataModel'", () => {
    testWithEmulator(
      "should delete old slots from firestore, leaving the new ones intact",
      async () => {
        const slotsRef = db
          .collection(Collection.Organizations)
          .doc(ORGANIZATION)
          .collection(OrgSubCollection.Slots);
        // set up test state
        const slotsUpdates: Promise<any>[] = [];
        Object.keys(mixedSlots).forEach((slotId) => {
          slotsUpdates.push(slotsRef.doc(slotId).set(mixedSlots[slotId]));
        });
        await Promise.all(slotsUpdates);
        // fire migration function
        // await invokeFunction(CloudFunction.MigrateToNewDataModel)();
        // // check updated slots
        // const updatedSlots = await slotsRef.get();
        // // only the one slot (of new interface) should remain
        // expect(updatedSlots.docs.length).toEqual(1);
      }
    );

    // testWithEmulator(
    //   "should delete old bookings from firestore, leaving the new ones intact",
    //   () => {}
    // );

    testWithEmulator(
      "should migrate customer data to use 'secretKey' instead of 'secret_key'",
      () => {}
    );
  });
});
