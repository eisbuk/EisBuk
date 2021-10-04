import * as functions from "firebase-functions";
import admin from "firebase-admin";
import _ from "lodash";

import { Category, SlotType, SlotInterface } from "eisbuk-shared";

import { checkUser, fs2luxon, roundTo } from "./utils";

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

  // we're creating four slots per day with these starting hours
  const startHours = [9, 10, 15, 17.5];
  // create an array of firestore.add() promises for four slots
  const toCreate = startHours.map((startHour, i) => {
    const date = new Timestamp(day, 0);
    const luxonDate = fs2luxon(date);

    // for diversity, we're creating two slots with one interval and two with three
    const durations = [60, ...(i > 1 ? [90, 120] : [])];

    // create intervals from provided durations (and start hour)
    const intervals = durations.reduce((acc, duration) => {
      const startTime = luxonDate
        .plus({ hours: startHour })
        .toISOTime()
        .substr(0, 5);
      const endTime = luxonDate
        .plus({ hours: startHour, minutes: duration })
        .toISOTime()
        .substr(0, 5);

      const key = `${startTime}-${endTime}`;

      return { ...acc, [key]: { startTime, endTime } };
    }, {} as SlotInterface["intervals"]);

    // populate slot with data
    const slotToCreate: SlotInterface = {
      id: `${day}-${startHour}`,
      date,
      intervals,
      categories: _.sampleSize(
        CATEGORIES,
        _.random(CATEGORIES.length - 1) + 1
      )!,
      notes: _.sample(NOTES)!,
      type: _.sample(TYPES)!,
    };

    return slotsColl.add(slotToCreate);
  });

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
