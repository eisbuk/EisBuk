import * as functions from "firebase-functions";
import admin from "firebase-admin";
import _ from "lodash";
import { DateTime } from "luxon";

import {
  Category,
  SlotType,
  SlotInterface,
  Collection,
  fromISO,
} from "eisbuk-shared";

import { __functionsZone__ } from "./constants";

import { checkUser } from "./utils";

const CATEGORIES = Object.values(Category);
const NOTES = ["", "Pista 1", "Pista 2"];
const TYPES = Object.values(SlotType);

/**
 * Fills day with four dummy slots
 * @param day
 * @param organization
 * @returns
 */
const fillDay = async (day: DateTime, organization: string): Promise<void> => {
  const date = day.toISO().substr(0, 10);
  const org = admin
    .firestore()
    .collection(Collection.Organizations)
    .doc(organization);

  const existing = await org
    .collection("slots")
    .where("date", "==", date)
    .get();

  // delete existing data
  const toDelete: Promise<FirebaseFirestore.WriteResult>[] = [];

  existing.forEach((el) => {
    toDelete.push(el.ref.delete());
  });

  await Promise.all(toDelete);

  const slotsColl = org.collection("slots");

  // we're creating four slots per day with these starting hours
  const startHours = [9, 10, 15, 17.5];
  // create an array of firestore.add() promises for four slots
  const toCreate = startHours.map((startHour, i) => {
    const luxonDate = fromISO(date);

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
  .region(__functionsZone__)
  .https.onCall(async ({ organization }: { organization: string }, context) => {
    await checkUser(organization, context.auth);

    functions.logger.info("Creating test slots...");

    const today = DateTime.now().startOf("day");
    const daysToFill: Promise<void>[] = [];

    for (let i = -14; i < 15; i++) {
      const day = today.plus({ days: i });
      daysToFill.push(fillDay(day, organization));
    }

    await Promise.all(daysToFill);

    return "Test slots created";
  });
