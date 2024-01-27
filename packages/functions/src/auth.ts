import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  AuthStatus,
  Collection,
  OrgSubCollection,
  QueryAuthStatusPayload,
  wrapIter,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

import { wrapHttpsOnCallHandler } from "./sentry-serverless-firebase";
import {
  checkRequiredFields,
  getAuthStrings,
  getOrgAdmins,
  isOrgAdmin,
} from "./utils";

export const queryAuthStatus = functions
  .runWith({
    timeoutSeconds: 20,
    // With these options, your minimum bill will be $4.54 in a 30-day month
    // It would be nice, but not nice enough to pay $4.54/month
    // minInstances: 1,
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    wrapHttpsOnCallHandler(
      "queryAuthStatus",
      async (
        payload: QueryAuthStatusPayload,
        { auth }
      ): Promise<AuthStatus> => {
        // Organization is required to even start the functionality
        checkRequiredFields(payload, ["organization"]);
        const { organization } = payload;

        const authStrings = getAuthStrings(auth);
        if (!authStrings.length) {
          return { isAdmin: false, secretKeys: [] };
        }

        // Check if user is admin of the organization
        const isAdmin = isOrgAdmin(
          authStrings,
          await getOrgAdmins(organization)
        );

        // Get secret keys associated with the user's auth strings
        const customersRef = admin
          .firestore()
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Customers);
        const customersByEmail = customersRef.where("email", "in", authStrings);
        const customersByPhone = customersRef.where("phone", "in", authStrings);

        const customers = await Promise.all([
          customersByEmail.get(),
          customersByPhone.get(),
        ]);

        const secretKeys = wrapIter(customers)
          .flatMap(({ docs }) => docs)
          .map((doc) => doc.data())
          .map(({ secretKey }) => secretKey)
          ._array();

        return { isAdmin, secretKeys };
      }
    )
  );
