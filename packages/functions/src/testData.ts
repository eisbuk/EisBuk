import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import _ from "lodash";
import { v4 } from "uuid";

import {
  Category,
  Collection,
  Customer,
  FIRST_NAMES,
  LAST_NAMES,
  OrgSubCollection,
  CreateAuthUserPayload,
  EmailType,
  SendCalendarFileTemplate,
  SendExtendedDateTemplate,
  SendBookingsLinkTemplate,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

import { checkUser, throwUnauth } from "./utils";

const uuidv4 = v4;

interface Payload {
  numUsers: number;
  organization: string;
}

/**
 * Creates users for provided organization
 */
export const createTestData = functions
  .region(__functionsZone__)
  .https.onCall(async ({ numUsers = 1, organization }: Payload, context) => {
    if (!(await checkUser(organization, context.auth))) throwUnauth();

    functions.logger.info(`Creating ${numUsers} test users`);
    functions.logger.error(`Creating ${numUsers} test users`);

    await createUsers(numUsers, organization);

    return { success: true };
  });

/**
 * Ping endpoint function
 */
export const ping = functions.region(__functionsZone__).https.onCall((data) => {
  functions.logger.info("ping invoked");
  return { pong: true, data: { ...data } };
});

/**
 * Creates dummy organizations with two dummy admins
 */
export const createOrganization = functions
  .region(__functionsZone__)
  .https.onCall(({ organization }: Pick<Payload, "organization">) => {
    const db = admin.firestore();

    return db
      .collection("organizations")
      .doc(organization)
      .set({
        admins: ["test@eisbuk.it", "+3912345678"],
        emailTemplates: {
          SendBookingsLinkTemplate,
          SendCalendarFileTemplate,
          SendExtendedDateTemplate,
        },
      });
  });

// #region createAuthUser

/**
 * A helper function triggered by multiple cloud functions,
 * used to create a user un auth as well as (optionally firestore)
 */
const createUserInAuth = async ({
  email,
  phoneNumber,
  password = "test00",
  organization,
  isAdmin,
}: CreateAuthUserPayload) => {
  // return early if no auth string provided
  if (!email && !phoneNumber) {
    return;
  }
  // create user in auth (if one doesn't exist)
  try {
    await admin.auth().createUser({
      email,
      phoneNumber,
      password,
    });
  } catch (err) {
    functions.logger.error(err);
  }
  // if should be admin, create entry in "admins" section
  // for provided organization
  if (isAdmin && organization) {
    const firestore = admin.firestore();

    const adminsEntry: string[] = [];
    if (email) adminsEntry.push(email);
    if (phoneNumber) adminsEntry.push(phoneNumber);

    await firestore
      .collection(Collection.Organizations)
      .doc(organization)
      .set(
        {
          admins: adminsEntry,
          displayName: organization,
          emailTemplates: {
            [EmailType.SendCalendarFile]: {
              subject: "Calendario prenotazioni {{ displayName }}",
              html: `<p>Ciao {{ name }},</p>
    <p>Ti inviamo un file per aggiungere le tue prossime lezioni con {{ displayName }} al tuo calendario:</p>
    <a href="{{ icsFile.ics }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>`,
            },
          },
        },
        { merge: true }
      );
  }
};

export const createUser = functions
  .region(__functionsZone__)
  .https.onCall(async (payload: CreateAuthUserPayload) =>
    createUserInAuth(payload)
  );

export const createDefaultUser = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }: Pick<Payload, "organization">) => {
    const defaultEmail = "test@eisbuk.it";
    const defaultPhone = "+3912345678";

    // create a default user if one doesn't exist
    await createUserInAuth({
      email: defaultEmail,
      phoneNumber: defaultPhone,
      organization,
      isAdmin: true,
    });

    return { organization };
  });
// #region createAuthUser

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
    const name = _.sample(FIRST_NAMES)!;
    const surname = _.sample(LAST_NAMES)!;
    const customer: Omit<Customer, "secretKey"> = {
      id: uuidv4(),
      birthday: "2000-01-01",
      name,
      surname,
      email: toEmail(`${name}.${surname}@example.com`.toLowerCase()),
      phone: "+385992211333",
      categories: [_.sample(Object.values(Category))!],
      certificateExpiration: DateTime.local()
        .plus({ days: _.random(-40, 200) })
        .toISODate(),
      covidCertificateReleaseDate: DateTime.local()
        .plus({ days: _.random(-500, 0) })
        .toISODate(),
      covidCertificateSuspended: _.sample([true, false])!,
    };

    await org
      .collection(OrgSubCollection.Customers)
      .doc(customer.id)
      .set(customer);
  });
};

/**
 * Creates email friendly string from provided str parameter
 * @param str string to convert to email
 * @returns email friendly string
 */
const toEmail = (str: string): string => _.deburr(str.replace(/ /i, "."));
