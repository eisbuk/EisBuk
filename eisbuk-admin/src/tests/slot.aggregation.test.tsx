import {
  // Category,
  Collection,
  OrgSubCollection,
  // SlotInterface,
  // SlotType,
  // SlotsById,
} from "eisbuk-shared";

import { adminDb } from "./settings";

import {
  deleteAll,
  deleteAllCollections,
  // loginDefaultUser,
  // createDefaultOrg,
} from "./utils";

// import { baseSlot } from "@/__testData__/dummyData";
// import { testDate, testDateLuxon } from "@/__testData__/date";
// import { luxon2ISODate } from "@/utils/date";
// import { getOrganization } from "@/config/envInfo";
// import { getDocumentRef, waitForCondition } from "@/__testUtils__/helpers";

beforeEach(async () => {
  await deleteAll([OrgSubCollection.Slots, OrgSubCollection.SlotsByDay]);
  await deleteAllCollections(adminDb, [Collection.Organizations]);
});

const maybeDescribe = process.env.FIRESTORE_EMULATOR_HOST
  ? describe
  : xdescribe;

// const monthString = testDate.substr(0, 7);

// const slotsPath = `${Collection.Organizations}/${getOrganization()}/${OrgSubCollection.Slots}`;
// const slotsByDayPath = `${Collection.Organizations}/${getOrganization()}/${OrgSubCollection.Slots}`;

maybeDescribe("Slot triggers", () => {
  it("update the slots summary on slot creation", async () => {
    // await Promise.all([createDefaultOrg(), loginDefaultUser()]);
    // // Create a slot
    // const slot = getDocumentRef(adminDb, `${slotsPath}/testSlot`);
    // await slot.set({ ...baseSlot, id: "testSlot" });
    // // Now check that the aggregate collection has been updated
    // let aggregateSlot = (await waitForCondition({
    //   documentPath: `${slotsByDayPath}/${monthString}`,
    //   condition: (data) =>
    //     Boolean(data) && Object.keys(data as Record<string, any>).length === 1,
    // })) as SlotsById;
    // expect(aggregateSlot[testDate].testSlot.type).toStrictEqual(SlotType.Ice);
    // // Create another slot on the previous day
    // const nextDay = testDateLuxon.plus({ days: 1 });
    // const nextDayTimestamp = { seconds: nextDay.toObject().second };
    // const nextDayISO = luxon2ISODate(nextDay);
    // const anotherSlot = getDocumentRef(adminDb, `${slotsPath}/anotherSlot`);
    // await anotherSlot.set({
    //   ...baseSlot,
    //   date: nextDayTimestamp,
    //   id: "anotherSlot",
    // } as SlotInterface);
    // aggregateSlot = await waitForCondition({
    //   documentPath: `${slotsByDayPath}/${monthString}`,
    //   condition: (data) => Boolean(data) && Object.keys(data).length === 2,
    // });
    // expect(aggregateSlot[nextDayISO].anotherSlot.type).toStrictEqual(
    //   SlotType.Ice
    // );
    // expect(aggregateSlot[nextDayISO].anotherSlot.id).toStrictEqual(
    //   "anotherSlot"
    // );
    // expect(Object.keys(aggregateSlot[testDate]).length).toStrictEqual(1);
    // expect(Object.keys(aggregateSlot[nextDayISO]).length).toStrictEqual(1);
    // // Remove one slot and make sure it's no longer in the aggregated record
    // await anotherSlot.delete();
    // // Create a third slot in a different day
    // const thirdSlot = org.collection(OrgSubCollection.Slots).doc("thirdSlot");
    // const thirdDay = testDateLuxon.plus({ days: 2 });
    // const thirdDayTimestamp = { seconds: thirdDay.toObject().second };
    // const thirdDayISO = luxon2ISODate(thirdDay);
    // await thirdSlot.set({
    //   ...baseSlot,
    //   date: thirdDayTimestamp,
    //   type: SlotType.Ice,
    //   categories: [Category.Competitive, Category.PreCompetitive],
    // });
    // await waitForRecord({
    //   record: aggregateSlotsQuery as any,
    //   numKeys: 3,
    // });
    // done();
  });
});
