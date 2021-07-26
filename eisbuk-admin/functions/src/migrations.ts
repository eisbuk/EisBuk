import * as functions from "firebase-functions";
import admin from "firebase-admin";
import _ from "lodash";

import { Category } from "./types/enums";

import { checkUser } from "./utils";

/**
 * Migrates slot entries to struct containing plural 'categories' instead of single 'category'
 */
export const migrateSlotsToPluralCategories = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }: { organization: string }, context) => {
    await checkUser(organization, context.auth);

    const org = admin.firestore().collection("organizations").doc(organization);
    const existing = await org.collection("slots").get();

    const operations: Promise<any>[] = [];

    existing.forEach((el) => {
      const slotData = el.data();
      const { category } = slotData as { category: Category };

      if (category) {
        const newData = {
          // Remove the old `category` field and add the new `categories` one
          ..._.omit(slotData, "category"),
          categories: [category],
        };
        operations.push(org.collection("slots").doc(el.id).set(newData));
      }
    });

    functions.logger.info(`Updating ${operations.length} records`);

    await Promise.all(operations);
    functions.logger.info(`Finished: ${operations.length} records updated`);
  });
