import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import _ from "lodash";
import { v4 } from "uuid";

import { Category } from "./types/enums";

import { checkUser } from "./utils";

import * as FIRST_NAMES from "./assets/italian-names.json";
import * as LAST_NAMES from "./assets/italian-surnames.json";

const uuidv4 = v4;

interface Payload {
  numUsers: number;
  organization: string;
}

/**
 * Creates users for provided organization
 */
export const createTestData = functions
  .region("europe-west6")
  .https.onCall(async ({ numUsers = 1, organization }: Payload, context) => {
    /** @TODO maybe create new organization if one doesn't exist */
    await checkUser(organization, context.auth);

    functions.logger.info(`Creating ${numUsers} test users`);
    functions.logger.error(`Creating ${numUsers} test users`);

    await createUsers(numUsers, organization);

    return { success: true };
  });

/**
 * Ping endpoint function
 */
export const ping = functions.region("europe-west6").https.onCall((data) => {
  functions.logger.info("ping invoked");
  return { pong: true, data: { ...data } };
});

/**
 * Creates dummy organizations with two dummy admins
 */
export const createOrganization = functions
  .region("europe-west6")
  .https.onCall(({ organization }: Pick<Payload, "organization">) => {
    const db = admin.firestore();

    return db
      .collection("organizations")
      .doc(organization)
      .set({
        admins: ["test@eisbuk.it", "+39123"],
      });
  });

/**
 * Creates provided number of users and adds them as customers to provided organization
 * @param numUsers
 * @param organization
 */
const createUsers = async (
  numUsers: number,
  organization: string
): Promise<void> => {
  const db = admin.firestore();
  const org = db.collection("organizations").doc(organization);

  _.range(numUsers).map(async () => {
    const name = _.sample(FIRST_NAMES);
    const surname = _.sample(LAST_NAMES);
    const customer = {
      id: uuidv4(),
      birthday: "2000-01-01",
      name,
      surname,
      email: toEmail(`${name}.${surname}@example.com`.toLowerCase()),
      phone: "12345",
      category: _.sample(Object.values(Category)),
      certificateExpiration: DateTime.local()
        .plus({ days: _.random(-40, 200) })
        .toISODate(),
    };

    await org.collection("customers").doc(customer.id).set(customer);
  });
};

/**
 * Creates email friendly string from provided str parameter
 * @param str string to convert to email
 * @returns email friendly string
 */
const toEmail = (str: string): string => _.deburr(str.replace(/ /i, "."));
