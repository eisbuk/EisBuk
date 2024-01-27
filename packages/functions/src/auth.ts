import * as functions from "firebase-functions";
import admin from "firebase-admin";

import {
  AuthStatus,
  Collection,
  OrganizationData,
  OrgSubCollection,
  QueryAuthStatusPayload,
  wrapIter,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

import { wrapHttpsOnCallHandler } from "./sentry-serverless-firebase";
import { checkRequiredFields, checkUser } from "./utils";

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

        await checkUser(organization, auth);

        // It's safe to cast this to non-null as the auth check has already been done
        const { email, phone_number: phone } = auth!.token!;
        // At least one of the two will be defined
        const authString = (email || phone) as string;

        const authStatus: AuthStatus = {
          isAdmin: false,
        };

        const orgRef = admin
          .firestore()
          .collection(Collection.Organizations)
          .doc(organization);
        const customersRef = orgRef.collection(OrgSubCollection.Customers);

        const [org, customers] = await Promise.all([
          orgRef.get(),
          customersRef.get(),
        ]);

        // query admin status
        const orgData = org.data() as OrganizationData;
        if (orgData) {
          authStatus.isAdmin = orgData.admins.includes(authString);
        }

        // query customer status
        const secretKeys = wrapIter(customers.docs)
          .map((doc) => doc.data())
          // We're filtering instead of finding as auth user can be associated with multiple customers
          .filter(({ email, phone }) => [email, phone].includes(authString))
          .map(({ secretKey }) => secretKey)
          ._array();

        authStatus.secretKeys = secretKeys;

        return authStatus;
      }
    )
  );
