import * as functions from "firebase-functions";
import admin from "firebase-admin";
import _ from "lodash";

import { Category, SlotType } from "./types/enums";

import { checkUser, roundTo } from "./utils";

const CATEGORIES = Object.values(Category);
const NOTES = ["", "Pista 1", "Pista 2"];
const TYPES = Object.values(SlotType);

/**
 * Fills day with four dummy slots
 * @param day
 * @param organization
 * @returns
 */
const fillDay = async (day: number, organization: string): Promise<void> => {
  const start = new admin.firestore.Timestamp(day, 0);
  const end = new admin.firestore.Timestamp(day + 86400, 0);
  const org = admin.firestore().collection("organizations").doc(organization);

  const existing = await org
    .collection("slots")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .get();

  // delete existing data
  const toDelete: Promise<FirebaseFirestore.WriteResult>[] = [];

  existing.forEach((el) => {
    toDelete.push(el.ref.delete());
  });

  await Promise.all(toDelete);

  const slotsColl = org.collection("slots");
  const Timestamp = admin.firestore.Timestamp;

  // create new slots
  const toCreate = [
    slotsColl.add({
      date: new Timestamp(day + 9 * 3600, 0),
      type: _.sample(TYPES),
      durations: ["60"],
      categories: _.sampleSize(CATEGORIES, _.random(CATEGORIES.length - 1) + 1),
      notes: _.sample(NOTES),
    }),
    slotsColl.add({
      date: new Timestamp(day + 10 * 3600, 0),
      type: _.sample(TYPES),
      durations: ["60"],
      categories: _.sampleSize(CATEGORIES, _.random(CATEGORIES.length - 1) + 1),
      notes: _.sample(NOTES),
    }),
    slotsColl.add({
      date: new Timestamp(day + 15 * 3600, 0),
      type: _.sample(TYPES),
      durations: ["60", "90", "120"],
      categories: _.sampleSize(CATEGORIES, _.random(CATEGORIES.length - 1) + 1),
      notes: _.sample(NOTES),
    }),
    slotsColl.add({
      date: new Timestamp(day + 17.5 * 3600, 0),
      type: _.sample(TYPES),
      durations: ["60", "90", "120"],
      categories: _.sampleSize(CATEGORIES, _.random(CATEGORIES.length - 1) + 1),
      notes: _.sample(NOTES),
    }),
  ];

  await Promise.all(toCreate);

  return;
};

/**
 * Fills a month worth of days with dummy slots, starting two weeks ago
 */
export const createTestSlots = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }: { organization: string }, context) => {
    await checkUser(organization, context.auth);

    functions.logger.info("Creating test slots...");

    const today = roundTo(admin.firestore.Timestamp.now().seconds, 86400);
    const daysToFill: Promise<void>[] = [];

    for (let i = -14; i < 15; i++) {
      const day = today + i * 86400;
      daysToFill.push(fillDay(day, organization));
    }

    await Promise.all(daysToFill);

    return "Test slots created";
  });
