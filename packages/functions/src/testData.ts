import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import _ from "lodash";
import { v4 } from "uuid";
import {
  wrapHttpsOnCallHandler,
  wrapHttpsOnRequestHandler,
} from "./sentry-serverless-firebase";

import {
  Category,
  Collection,
  FIRST_NAMES,
  LAST_NAMES,
  OrgSubCollection,
  CreateAuthUserPayload,
  defaultEmailTemplates as emailTemplates,
  defaultSMSTemplates as smsTemplates,
  CustomerFull,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

import { checkIsAdmin, throwUnauth } from "./utils";

const uuidv4 = v4;

interface CreateTestDataPayload {
  numUsers: number;
  organization: string;
}

interface CreateOrganizationPayload {
  organization: string;
  displayName?: string;
}

/**
 * Creates users for provided organization
 */
export const createTestData = functions.region(__functionsZone__).https.onCall(
  wrapHttpsOnCallHandler(
    "createTestData",
    async ({ numUsers = 1, organization }: CreateTestDataPayload, context) => {
      if (!(await checkIsAdmin(organization, context.auth))) throwUnauth();

      functions.logger.info(`Creating ${numUsers} test users`);
      functions.logger.error(`Creating ${numUsers} test users`);

      await createUsers(numUsers, organization);

      return { success: true };
    }
  )
);

/**
 * Ping endpoint function
 */
export const ping = functions.region(__functionsZone__).https.onCall(
  wrapHttpsOnCallHandler("ping", (data) => {
    functions.logger.info("ping invoked");
    return { pong: true, data: { ...data } };
  })
);

/**
 * Function to throw an error on purpose
 */
export const testException = functions
  .region(__functionsZone__)
  .https.onRequest(
    wrapHttpsOnRequestHandler("testException", (req, res) => {
      // get the `throwError` query param
      const throwError = Boolean(req.query.throwError);
      if (throwError) {
        functions.logger.info("Throwing an error as requested");
        throw new Error(req.query.throwError?.toString());
      }
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify({ pong: true, data: { ...req.query } }));
    })
  );

/**
 * Creates dummy organizations with two dummy admins
 */
export const createOrganization = functions
  .region(__functionsZone__)
  .https.onCall(
    ({ organization, displayName: dn }: CreateOrganizationPayload) => {
      const db = admin.firestore();

      const orgRef = db.collection(Collection.Organizations).doc(organization);

      const displayName =
        dn || organization.replace(/^[a-z]/, (c) => c.toUpperCase());

      return orgRef.set({
        displayName,
        admins: ["test@eisbuk.it", "+3912345678"],
        emailTemplates,
        smsTemplates,
      });
    }
  );

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

    await firestore.collection(Collection.Organizations).doc(organization).set(
      {
        admins: adminsEntry,
        displayName: organization,
        emailTemplates,
        smsTemplates,
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
  .https.onCall(async ({ organization }: { organization: string }) => {
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

/**
 * Quick setup of smtp config for testing purposes.
 */
export const setupEmailForTesting = functions
  .region(__functionsZone__)
  .https.onCall(
    async (
      { organization, smtpHost = "localhost", smtpPort = 5000 },
      context
    ) => {
      await checkIsAdmin(organization, context.auth);

      const smtpConfig = {
        smtpUser: "Foo",
        smtpPass: "Bar",
        smtpHost,
        smtpPort,
      };

      const emailFrom = "dummy@email.com";

      const orgRef = admin
        .firestore()
        .collection(Collection.Organizations)
        .doc(organization);
      const secretsRef = admin
        .firestore()
        .collection(Collection.Secrets)
        .doc(organization);

      await Promise.all([
        orgRef.set({ emailFrom }, { merge: true }),
        secretsRef.set(smtpConfig, { merge: true }),
      ]);

      return { success: true, smtpConfig, emailFrom };
    }
  );
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
    const customer: Omit<CustomerFull, "secretKey" | "subscriptionNumber"> = {
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
